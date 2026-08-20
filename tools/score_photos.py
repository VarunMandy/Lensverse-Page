"""
Lensverse photo rating engine.

Scores every photograph in Photos/ on seven measurable qualities and writes a
0-100 rating. The gallery uses these ratings to order itself strongest-first.

The metrics are deliberately explainable -- each one maps to something a
photographer would actually critique in a print review:

  sharpness   peak local detail (tile-based, so shallow depth-of-field and
              intentional background blur are not punished)
  exposure    tonal coverage minus highlight/shadow clipping
  contrast    usable dynamic range
  color       Hasler-Susstrunk colourfulness; for monochrome frames this
              falls back to tonal separation so good B&W is not buried
  composition rule-of-thirds / symmetry placement of the salient mass,
              penalised when the subject is jammed into the frame edge
  isolation   how cleanly the subject separates from its background
  technical   resolution and sane aspect ratio

No third-party services and no network access: numpy + Pillow only, so the
scores are deterministic and reproducible.

Usage:
    python tools/score_photos.py                # score everything, print table
    python tools/score_photos.py --json out.json
"""

from __future__ import annotations

import argparse
import json
import math
import os
from dataclasses import dataclass, field, asdict
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps

Image.MAX_IMAGE_PIXELS = None

# Long edge used for analysis. Big enough to judge detail, small enough to be fast.
ANALYSIS_EDGE = 1024

WEIGHTS = {
    "sharpness": 18.0,
    "exposure": 14.0,
    "contrast": 12.0,
    "color": 12.0,
    "composition": 16.0,
    "isolation": 12.0,
    "technical": 16.0,
}


# --------------------------------------------------------------------------
# small numpy helpers (kept dependency-free -- no scipy)
# --------------------------------------------------------------------------

def _clamp01(x: float) -> float:
    return float(min(1.0, max(0.0, x)))


def _luma(rgb: np.ndarray) -> np.ndarray:
    """Rec.709 luminance from a float HxWx3 array in 0..1."""
    return 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]


def _laplacian(g: np.ndarray) -> np.ndarray:
    """4-neighbour Laplacian on the interior of a 2-D array."""
    return (
        4.0 * g[1:-1, 1:-1]
        - g[:-2, 1:-1]
        - g[2:, 1:-1]
        - g[1:-1, :-2]
        - g[1:-1, 2:]
    )


def _gradient_magnitude(g: np.ndarray) -> np.ndarray:
    """Central-difference gradient magnitude, same shape as the interior."""
    gx = g[1:-1, 2:] - g[1:-1, :-2]
    gy = g[2:, 1:-1] - g[:-2, 1:-1]
    return np.sqrt(gx * gx + gy * gy)


def _resize_map(m: np.ndarray, size: int) -> np.ndarray:
    """Downsample a 2-D float map to size x size with bilinear averaging."""
    lo, hi = float(m.min()), float(m.max())
    span = hi - lo
    norm = (m - lo) / span if span > 1e-9 else np.zeros_like(m)
    img = Image.fromarray((norm * 255.0).astype(np.uint8), mode="L")
    img = img.resize((size, size), Image.BILINEAR)
    return np.asarray(img, dtype=np.float64) / 255.0


# --------------------------------------------------------------------------
# individual metrics
# --------------------------------------------------------------------------

def _score_sharpness(g: np.ndarray) -> float:
    """Peak local sharpness: 90th-percentile Laplacian variance across tiles.

    Using the best tiles rather than the whole frame means a portrait with tack
    sharp eyes over a creamy background scores as sharp -- which is correct.
    """
    lap = _laplacian(g)
    h, w = lap.shape
    tiles, step_y, step_x = [], max(1, h // 8), max(1, w // 8)
    for y in range(0, h - step_y + 1, step_y):
        for x in range(0, w - step_x + 1, step_x):
            tiles.append(float(np.var(lap[y:y + step_y, x:x + step_x])))
    if not tiles:
        return 0.0
    peak = float(np.percentile(tiles, 90)) * (255.0 ** 2)
    # log compression: ~1500 units of variance reads as fully sharp
    return _clamp01(math.log1p(peak) / math.log1p(1500.0))


def _score_exposure(g: np.ndarray) -> float:
    """Tonal coverage (histogram entropy) minus clipping penalty."""
    q = np.clip((g * 255.0).astype(np.int32), 0, 255)
    hist = np.bincount(q.ravel(), minlength=256).astype(np.float64)
    total = hist.sum()
    if total <= 0:
        return 0.0
    p = hist / total
    nz = p[p > 0]
    entropy = float(-(nz * np.log(nz)).sum()) / math.log(256.0)

    crushed = float(p[:4].sum())
    blown = float(p[252:].sum())
    # half a percent of each is normal and often desirable
    penalty = _clamp01((max(0.0, crushed - 0.005) + max(0.0, blown - 0.005)) / 0.10)
    return _clamp01(0.62 * entropy + 0.38 * (1.0 - penalty))


def _score_contrast(g: np.ndarray) -> float:
    p1, p99 = np.percentile(g, [1.0, 99.0])
    spread = _clamp01(float(p99 - p1) / 0.92)
    punch = _clamp01(float(g.std()) / 0.22)
    return _clamp01(0.55 * spread + 0.45 * punch)


def _score_color(rgb: np.ndarray, contrast: float) -> tuple[float, bool]:
    """Hasler-Susstrunk colourfulness, with a monochrome fallback.

    A strong black-and-white frame has near-zero colourfulness but should not be
    penalised for it, so monochrome images are judged on tonal separation.
    """
    mx = rgb.max(axis=2)
    mn = rgb.min(axis=2)
    saturation = float((mx - mn).mean())
    monochrome = saturation < 0.06

    rg = rgb[..., 0] - rgb[..., 1]
    yb = 0.5 * (rgb[..., 0] + rgb[..., 1]) - rgb[..., 2]
    std = math.sqrt(float(rg.std()) ** 2 + float(yb.std()) ** 2)
    mean = math.sqrt(float(rg.mean()) ** 2 + float(yb.mean()) ** 2)
    colourfulness = (std + 0.3 * mean) * 255.0

    if monochrome:
        return _clamp01(0.30 + 0.70 * contrast), True
    return _clamp01(colourfulness / 95.0), False


def _score_composition(saliency: np.ndarray) -> float:
    """Placement of the salient mass: rule of thirds, or deliberate symmetry."""
    total = float(saliency.sum())
    if total <= 1e-9:
        return 0.0
    n = saliency.shape[0]
    coords = (np.arange(n) + 0.5) / n
    cx = float((saliency.sum(axis=0) * coords).sum() / total)
    cy = float((saliency.sum(axis=1) * coords).sum() / total)

    thirds = [(1 / 3, 1 / 3), (2 / 3, 1 / 3), (1 / 3, 2 / 3), (2 / 3, 2 / 3)]
    d_thirds = min(math.dist((cx, cy), pt) for pt in thirds)
    thirds_score = 1.0 - _clamp01(d_thirds / 0.26)

    d_center = math.dist((cx, cy), (0.5, 0.5))
    center_score = 1.0 - _clamp01(d_center / 0.20)

    a = saliency - saliency.mean()
    b = np.fliplr(saliency) - saliency.mean()
    denom = float(np.sqrt((a * a).sum() * (b * b).sum()))
    corr = float((a * b).sum() / denom) if denom > 1e-9 else 0.0
    sym_score = _clamp01((corr - 0.45) / 0.45)

    score = max(thirds_score, 0.55 * center_score + 0.45 * sym_score)

    # subject crammed against the frame edge reads as careless
    border = max(1, n // 12)
    edge_mass = total - float(saliency[border:-border, border:-border].sum())
    edge_ratio = edge_mass / total
    score -= _clamp01((edge_ratio - 0.38) / 0.40) * 0.22
    return _clamp01(score)


def _score_isolation(saliency: np.ndarray) -> float:
    """How much more interesting the subject is than its background."""
    thresh = float(np.percentile(saliency, 75.0))
    fg = saliency[saliency >= thresh]
    bg = saliency[saliency < thresh]
    if fg.size == 0 or bg.size == 0:
        return 0.0
    ratio = float(fg.mean()) / (float(bg.mean()) + 1e-6)
    return _clamp01(math.log(max(ratio, 1.0)) / math.log(9.0))


def _score_technical(width: int, height: int) -> float:
    megapixels = (width * height) / 1e6
    res = _clamp01(megapixels / 8.0)
    long_edge, short_edge = max(width, height), min(width, height)
    ratio = long_edge / max(1, short_edge)
    aspect = 1.0 if ratio <= 2.2 else _clamp01(1.0 - (ratio - 2.2) / 2.0)
    return _clamp01(0.75 * res + 0.25 * aspect)


# --------------------------------------------------------------------------
# per-file analysis
# --------------------------------------------------------------------------

@dataclass
class PhotoScore:
    file: str
    width: int
    height: int
    raw: float
    components: dict = field(default_factory=dict)
    monochrome: bool = False
    captured: str | None = None
    score: float = 0.0  # filled in after rank normalisation


def analyse(path: Path) -> PhotoScore:
    with Image.open(path) as im:
        captured = _exif_datetime(im)
        im = ImageOps.exif_transpose(im)
        width, height = im.size
        im.draft("RGB", (ANALYSIS_EDGE, ANALYSIS_EDGE))  # fast DCT-scaled decode
        work = im.convert("RGB")
        work.thumbnail((ANALYSIS_EDGE, ANALYSIS_EDGE), Image.LANCZOS)
        rgb = np.asarray(work, dtype=np.float64) / 255.0

    g = _luma(rgb)
    saliency = _resize_map(_gradient_magnitude(g), 36)

    contrast = _score_contrast(g)
    color, monochrome = _score_color(rgb, contrast)
    components = {
        "sharpness": _score_sharpness(g),
        "exposure": _score_exposure(g),
        "contrast": contrast,
        "color": color,
        "composition": _score_composition(saliency),
        "isolation": _score_isolation(saliency),
        "technical": _score_technical(width, height),
    }
    raw = sum(components[k] * WEIGHTS[k] for k in WEIGHTS)

    return PhotoScore(
        file=path.name,
        width=width,
        height=height,
        raw=round(raw, 3),
        components={k: round(v, 4) for k, v in components.items()},
        monochrome=monochrome,
        captured=captured,
    )


def _exif_datetime(im: Image.Image) -> str | None:
    """DateTimeOriginal as ISO-ish text, for the 'newest first' sort."""
    try:
        exif = im.getexif()
        for tag in (36867, 36868, 306):  # DateTimeOriginal, DateTimeDigitized, DateTime
            value = exif.get(tag)
            if isinstance(value, bytes):
                value = value.decode("utf-8", "ignore")
            if isinstance(value, str) and len(value) >= 19:
                date, _, clock = value.partition(" ")
                return f"{date.replace(':', '-')}T{clock}"
        ifd = exif.get_ifd(0x8769)
        for tag in (36867, 36868):
            value = ifd.get(tag)
            if isinstance(value, str) and len(value) >= 19:
                date, _, clock = value.partition(" ")
                return f"{date.replace(':', '-')}T{clock}"
    except Exception:
        pass
    return None


def normalise(scores: list[PhotoScore]) -> None:
    """Blend the raw score with its percentile rank.

    Raw weighted sums bunch up in a narrow band, which makes the published
    numbers feel arbitrary. Blending in the percentile spreads them across a
    readable 58-98 range. Both terms are monotonic in `raw`, so the ordering is
    exactly the raw ordering -- only the labels are rescaled.
    """
    if not scores:
        return
    if len(scores) == 1:
        scores[0].score = round(min(98.0, max(58.0, scores[0].raw)), 1)
        return

    order = sorted(range(len(scores)), key=lambda i: scores[i].raw)
    n = len(scores)
    for rank, idx in enumerate(order):
        pct = rank / (n - 1)
        curved = 58.0 + 40.0 * (pct ** 0.85)
        scores[idx].score = round(0.5 * curved + 0.5 * scores[idx].raw, 1)


def main() -> int:
    ap = argparse.ArgumentParser(description="Rate every photo in Photos/")
    ap.add_argument("--photos", default="Photos", help="source directory")
    ap.add_argument("--json", default=None, help="write results to this JSON file")
    ap.add_argument("--quiet", action="store_true")
    args = ap.parse_args()

    root = Path(args.photos)
    if not root.is_dir():
        print(f"error: {root} is not a directory")
        return 1

    files = sorted(
        (p for p in root.iterdir()
         if p.is_file() and p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp", ".avif"}),
        key=lambda p: p.name.lower(),
    )
    if not files:
        print(f"error: no images found in {root}")
        return 1

    results: list[PhotoScore] = []
    for i, path in enumerate(files, 1):
        try:
            results.append(analyse(path))
        except Exception as exc:  # a corrupt file should not kill the run
            print(f"  !! {path.name}: {exc}")
            continue
        if not args.quiet:
            print(f"  [{i}/{len(files)}] {path.name}", flush=True)

    normalise(results)
    results.sort(key=lambda r: -r.score)

    if not args.quiet:
        print(f"\n{'rank':>4}  {'score':>5}  {'file':<22} "
              f"{'shrp':>5}{'expo':>6}{'cont':>6}{'colr':>6}{'comp':>6}{'isol':>6}")
        for rank, r in enumerate(results, 1):
            c = r.components
            mono = " (b&w)" if r.monochrome else ""
            print(f"{rank:>4}  {r.score:>5.1f}  {r.file:<22} "
                  f"{c['sharpness']:>5.2f}{c['exposure']:>6.2f}{c['contrast']:>6.2f}"
                  f"{c['color']:>6.2f}{c['composition']:>6.2f}{c['isolation']:>6.2f}{mono}")
        band = [r.score for r in results]
        print(f"\n{len(results)} photos scored | "
              f"high {max(band):.1f} | median {sorted(band)[len(band)//2]:.1f} | low {min(band):.1f}")

    if args.json:
        Path(args.json).write_text(
            json.dumps([asdict(r) for r in results], indent=2), encoding="utf-8"
        )
        if not args.quiet:
            print(f"wrote {args.json}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
