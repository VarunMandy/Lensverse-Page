"""
Lensverse build step.

Turns the full-resolution originals in Photos/ into a fast, responsive gallery:

  1. rates every photo with tools/score_photos.py
  2. encodes AVIF + WebP derivatives at 400 / 800 / 1200 px wide for the grid,
     plus a 2000 px long-edge version for the lightbox, and one JPEG at 800 px
     as a fallback for browsers that support neither modern format
  3. embeds a 20 px LQIP thumbnail per photo as a data URI so the grid paints
     instantly with zero layout shift
  4. writes photos.json -- the only file the site actually reads
  5. renders the social preview image and the sitemap

EXIF is dropped on every derivative, so GPS coordinates in the originals are
never published.

Usage:
    python tools/build.py                 # full build
    python tools/build.py --manifest-only # re-score + rewrite JSON, skip encoding
    python tools/build.py --jobs 4
"""

from __future__ import annotations

import argparse
import base64
import io
import json
import os
import re
import shutil
import sys
import time
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

from PIL import Image, ImageOps

sys.path.insert(0, str(Path(__file__).resolve().parent))
from score_photos import analyse, normalise  # noqa: E402

Image.MAX_IMAGE_PIXELS = None

ROOT = Path(__file__).resolve().parent.parent
PHOTOS = ROOT / "Photos"
MEDIA = ROOT / "media"
META = ROOT / "content" / "photos.meta.json"
MANIFEST = ROOT / "photos.json"
RATINGS_REPORT = ROOT / "tools" / "ratings.report.json"
PROJECTS_META = ROOT / "content" / "projects.meta.json"
PROJECTS_MANIFEST = ROOT / "projects.json"

GRID_WIDTHS = (400, 800, 1200)
LIGHTBOX_EDGE = 2000
HERO_WIDTHS = (960, 1440, 1920, 2560)
LQIP_WIDTH = 20

AVIF_QUALITY = 58
AVIF_SPEED = 6
WEBP_QUALITY = 78
JPEG_QUALITY = 82

SITE_URL = "https://varunmandy.github.io/Lensverse-Page"  # used for sitemap + og:url


def slugify(name: str) -> str:
    stem = Path(name).stem.lower()
    stem = re.sub(r"[^a-z0-9]+", "-", stem).strip("-")
    return stem or "photo"


def _save_avif(im: Image.Image, path: Path) -> None:
    try:
        im.save(path, format="AVIF", quality=AVIF_QUALITY, speed=AVIF_SPEED)
    except (OSError, ValueError):
        # older Pillow AVIF plugins reject `speed`
        im.save(path, format="AVIF", quality=AVIF_QUALITY)


def _lqip(im: Image.Image) -> str:
    """Tiny blurred placeholder as a WebP data URI."""
    w, h = im.size
    tiny = im.resize((LQIP_WIDTH, max(1, round(LQIP_WIDTH * h / w))), Image.LANCZOS)
    buf = io.BytesIO()
    tiny.save(buf, format="WEBP", quality=42, method=4)
    return "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


def encode_one(source: str, slug: str) -> dict:
    """Encode every derivative for one photo. Runs in a worker process."""
    src = Path(source)
    with Image.open(src) as raw:
        im = ImageOps.exif_transpose(raw).convert("RGB")

    full_w, full_h = im.size
    written = 0

    # Master working copy: 2000 px long edge, used for the lightbox and as the
    # parent for every smaller size (one expensive decode, many cheap resizes).
    scale = LIGHTBOX_EDGE / max(full_w, full_h)
    if scale < 1.0:
        base = im.resize((max(1, round(full_w * scale)), max(1, round(full_h * scale))),
                         Image.LANCZOS, reducing_gap=3.0)
    else:
        base = im.copy()
    im.close()

    _save_avif(base, MEDIA / f"{slug}-full.avif")
    base.save(MEDIA / f"{slug}-full.webp", format="WEBP",
              quality=WEBP_QUALITY, method=4)
    written += 2

    widths = []
    for target in GRID_WIDTHS:
        w = min(target, base.width)
        h = max(1, round(base.height * w / base.width))
        variant = base.resize((w, h), Image.LANCZOS, reducing_gap=3.0)
        _save_avif(variant, MEDIA / f"{slug}-{target}.avif")
        variant.save(MEDIA / f"{slug}-{target}.webp", format="WEBP",
                     quality=WEBP_QUALITY, method=4)
        if target == 800:
            variant.save(MEDIA / f"{slug}-800.jpg", format="JPEG",
                         quality=JPEG_QUALITY, optimize=True, progressive=True)
            written += 1
        widths.append(target)
        written += 2
        variant.close()

    lqip = _lqip(base)
    base.close()

    return {"slug": slug, "widths": widths, "lqip": lqip, "files": written}


def load_meta() -> dict:
    if not META.exists():
        sys.exit(f"error: missing {META}")
    return json.loads(META.read_text(encoding="utf-8"))


def build_hero(slug_of: dict, chosen: str) -> dict:
    """Encode the wide hero backdrop and the social preview card."""
    src = PHOTOS / chosen
    with Image.open(src) as raw:
        im = ImageOps.exif_transpose(raw).convert("RGB")

    sources = []
    for width in HERO_WIDTHS:
        if width > im.width * 1.02:
            continue
        h = max(1, round(im.height * width / im.width))
        variant = im.resize((width, h), Image.LANCZOS, reducing_gap=3.0)
        _save_avif(variant, MEDIA / f"hero-{width}.avif")
        variant.save(MEDIA / f"hero-{width}.webp", format="WEBP",
                     quality=WEBP_QUALITY, method=4)
        sources.append(width)
        variant.close()

    # 1200x630 social card, centre-cropped
    card = ImageOps.fit(im, (1200, 630), Image.LANCZOS, centering=(0.5, 0.42))
    card.save(ROOT / "og-image.jpg", format="JPEG", quality=86,
              optimize=True, progressive=True)
    card.close()

    lqip = _lqip(im)
    im.close()
    return {"source": chosen, "widths": sources, "lqip": lqip}


def build_portrait(name: str) -> dict | None:
    """Responsive derivatives for the About portrait.

    It lives in Photos/ but is excluded from the gallery, so it would otherwise
    be served as a multi-megabyte original.
    """
    src = PHOTOS / name
    if not src.exists():
        return None
    with Image.open(src) as raw:
        im = ImageOps.exif_transpose(raw).convert("RGB")

    widths = []
    for width in (400, 800, 1200):
        if width > im.width * 1.02:
            continue
        h = max(1, round(im.height * width / im.width))
        variant = im.resize((width, h), Image.LANCZOS, reducing_gap=3.0)
        _save_avif(variant, MEDIA / f"portrait-{width}.avif")
        variant.save(MEDIA / f"portrait-{width}.webp", format="WEBP",
                     quality=WEBP_QUALITY, method=4)
        if width == 800:
            variant.save(MEDIA / "portrait-800.jpg", format="JPEG",
                         quality=JPEG_QUALITY, optimize=True, progressive=True)
        widths.append(width)
        variant.close()

    info = {"widths": widths, "width": im.width, "height": im.height,
            "lqip": _lqip(im)}
    im.close()
    return info


def natural_key(name: str):
    """01.jpg before 10.jpg, and Untitled-2 before Untitled-10."""
    m = re.search(r"(\d+)", Path(name).stem)
    return (int(m.group(1)) if m else 0, name.lower())


def load_projects() -> list[dict]:
    """Read project definitions and resolve each one's photo list.

    A project is a *sequence*, so photos stay in filename order. The rating
    engine is only consulted to pick a cover when none is named.
    """
    if not PROJECTS_META.exists():
        return []
    data = json.loads(PROJECTS_META.read_text(encoding="utf-8"))
    projects = []
    for spec in data.get("projects", []):
        if spec.get("slug", "").startswith("_"):
            continue
        folder = PHOTOS / spec["folder"]
        if not folder.is_dir():
            print(f"warning: project '{spec['slug']}' folder not found: {folder}")
            continue
        files = sorted((p.name for p in folder.iterdir()
                        if p.is_file() and p.suffix.lower() in
                        {".jpg", ".jpeg", ".png", ".webp"}),
                       key=natural_key)
        if not files:
            print(f"warning: project '{spec['slug']}' has no images")
            continue
        if spec.get("inGallery"):
            print(f"warning: project '{spec['slug']}' sets inGallery, which is not "
                  f"wired up yet — its photos appear on the project page only")
        projects.append({**spec, "files": files, "dir": folder})
    return projects


def build_icons() -> list[int]:
    """Raster app icons, drawn to match favicon.svg.

    iOS ignores SVG for apple-touch-icon and falls back to a screenshot of the
    page, so PNGs are not optional. Drawn rather than rasterised because Pillow
    cannot read SVG.
    """
    import math

    from PIL import ImageDraw

    BG, GOLD = (10, 10, 12), (227, 184, 118)
    written = []

    def draw(size: int, pad_ratio: float = 0.0) -> Image.Image:
        """A lens iris: outer ring plus six blades tangent to a hexagonal
        opening. Blades must not meet at the centre -- spokes through the middle
        read as a wagon wheel, not an aperture."""
        s = size * 4                      # supersample, then downscale
        img = Image.new("RGB", (s, s), BG)
        d = ImageDraw.Draw(img)
        c = s / 2
        span = (1.0 - 2 * pad_ratio)      # maskable icons need a safe margin
        R = 0.375 * s * span              # outer ring radius
        r = 0.150 * s * span              # hexagonal opening radius
        w = max(1, int(round(0.030 * s * span)))

        def polar(radius, deg):
            a = math.radians(deg)
            return (c + radius * math.cos(a), c + radius * math.sin(a))

        d.ellipse([c - R, c - R, c + R, c + R], outline=GOLD, width=w)

        # the opening
        hexagon = [polar(r, -90 + 60 * i) for i in range(6)]
        d.line(hexagon + [hexagon[0]], fill=GOLD, width=w, joint="curve")

        # one blade per vertex, each swept the same way so the iris looks wound
        for i in range(6):
            start = hexagon[i]
            end = polar(R, -90 + 60 * (i + 1))
            d.line([start, end], fill=GOLD, width=w, joint="curve")

        return img.resize((size, size), Image.LANCZOS)

    for size in (180, 192, 512):
        draw(size).save(ROOT / f"icon-{size}.png", format="PNG", optimize=True)
        written.append(size)
    # Android masks maskable icons to a circle; keep the mark inside the safe area
    draw(512, pad_ratio=0.10).save(ROOT / "icon-512-maskable.png",
                                   format="PNG", optimize=True)
    return written


def write_sitemap(routes: list[str]) -> None:
    today = time.strftime("%Y-%m-%d")
    urls = "\n".join(
        f"  <url>\n    <loc>{SITE_URL}{r}</loc>\n"
        f"    <lastmod>{today}</lastmod>\n"
        f"    <changefreq>monthly</changefreq>\n"
        f"    <priority>{'1.0' if r == '/' else '0.8'}</priority>\n  </url>"
        for r in routes
    )
    (ROOT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f"{urls}\n</urlset>\n",
        encoding="utf-8",
    )
    (ROOT / "robots.txt").write_text(
        f"User-agent: *\nAllow: /\n\nSitemap: {SITE_URL}/sitemap.xml\n",
        encoding="utf-8",
    )


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--jobs", type=int, default=max(1, (os.cpu_count() or 4) - 1))
    ap.add_argument("--manifest-only", action="store_true",
                    help="re-score and rewrite photos.json without re-encoding")
    ap.add_argument("--clean", action="store_true", help="wipe media/ first")
    args = ap.parse_args()

    meta = load_meta()
    entries: dict = meta["photos"]
    excluded = set(meta.get("exclude", []))
    curation = meta.get("curation", {})
    pinned: list[str] = [p for p in curation.get("pin", []) if p]
    boosts: dict = {k: float(v) for k, v in (curation.get("boost") or {}).items()
                    if not k.startswith("_")}

    available = {p.name for p in PHOTOS.iterdir() if p.is_file()}
    wanted = [n for n in entries if not n.startswith("_")]

    missing = [n for n in wanted if n not in available]
    orphans = sorted(available - set(wanted) - excluded)
    if missing:
        print(f"warning: {len(missing)} listed but not on disk -> skipped: "
              f"{', '.join(missing)}")
    if orphans:
        print(f"warning: {len(orphans)} on disk but not in photos.meta.json "
              f"(they will not appear): {', '.join(orphans)}")

    names = [n for n in wanted if n in available]
    if not names:
        sys.exit("error: nothing to build")

    MEDIA.mkdir(parents=True, exist_ok=True)
    if args.clean:
        # Empty the directory rather than removing it: OneDrive keeps a handle on
        # synced folders, so rmdir fails with WinError 5 even when it is empty.
        stale = 0
        for f in MEDIA.iterdir():
            try:
                f.unlink() if f.is_file() else shutil.rmtree(f, ignore_errors=True)
                stale += 1
            except OSError as exc:
                print(f"  !! could not remove {f.name}: {exc}")
        if stale:
            print(f"cleaned {stale} stale file(s) from media/")

    projects = load_projects()

    # ---- 1. rate ---------------------------------------------------------
    print(f"rating {len(names)} photos ...")
    scored = []
    for i, name in enumerate(names, 1):
        scored.append(analyse(PHOTOS / name))
        if i % 10 == 0 or i == len(names):
            print(f"  {i}/{len(names)}", flush=True)
    normalise(scored)
    by_name = {s.file: s for s in scored}

    slugs, seen = {}, set()
    for name in names:
        slug = slugify(name)
        n = 2
        while slug in seen:
            slug, n = f"{slugify(name)}-{n}", n + 1
        seen.add(slug)
        slugs[name] = slug

    # Project photos are scored separately: they are ranked only against their
    # own project, so a cover choice is not skewed by the main gallery.
    for proj in projects:
        print(f"rating project '{proj['slug']}' ({len(proj['files'])} photos) ...")
        pscored = [analyse(proj["dir"] / f) for f in proj["files"]]
        normalise(pscored)
        proj["scored"] = {s.file: s for s in pscored}
        proj["slugs"] = {f: f"{proj['slug']}-{Path(f).stem}" for f in proj["files"]}

    # ---- 2. encode -------------------------------------------------------
    # Every derivative, gallery and project alike, keyed by (project slug or
    # None, filename) so the two namespaces cannot collide.
    derived: dict = {}
    jobs = [(None, n, PHOTOS / n, slugs[n]) for n in names]
    for proj in projects:
        jobs += [(proj["slug"], f, proj["dir"] / f, proj["slugs"][f])
                 for f in proj["files"]]

    if args.manifest_only:
        # Carry the LQIP placeholders and width lists over from the previous
        # manifests -- they describe files we are deliberately not re-encoding,
        # so dropping them would silently regress the grid to blank frames.
        reused = 0
        if MANIFEST.exists():
            previous = json.loads(MANIFEST.read_text(encoding="utf-8"))
            for entry in previous.get("photos", []):
                if entry.get("lqip"):
                    derived[(None, entry["src"])] = {
                        "lqip": entry["lqip"],
                        "widths": entry.get("widths", list(GRID_WIDTHS))}
                    reused += 1
        if PROJECTS_MANIFEST.exists():
            prev = json.loads(PROJECTS_MANIFEST.read_text(encoding="utf-8"))
            for p in prev.get("projects", []):
                for entry in p.get("photos", []):
                    if entry.get("lqip"):
                        derived[(p["slug"], entry["src"])] = {
                            "lqip": entry["lqip"],
                            "widths": entry.get("widths", list(GRID_WIDTHS))}
                        reused += 1
        print(f"skipping encode (--manifest-only); reused {reused} placeholders")
    else:
        print(f"encoding {len(jobs)} images with {args.jobs} workers ...")
        t0 = time.time()
        done = 0
        with ProcessPoolExecutor(max_workers=args.jobs) as pool:
            futures = {pool.submit(encode_one, str(path), slug): (owner, name)
                       for owner, name, path, slug in jobs}
            for fut in as_completed(futures):
                key = futures[fut]
                try:
                    derived[key] = fut.result()
                except Exception as exc:
                    print(f"  !! {key[1]}: {exc}")
                done += 1
                if done % 5 == 0 or done == len(jobs):
                    rate = done / max(0.001, time.time() - t0)
                    eta = (len(jobs) - done) / max(rate, 1e-6)
                    print(f"  {done}/{len(jobs)}  ({rate:.2f}/s, eta {eta:.0f}s)",
                          flush=True)
        print(f"encoded in {time.time() - t0:.0f}s")

    # ---- 3. hero ---------------------------------------------------------
    hero_pick = meta.get("hero")
    if not hero_pick or hero_pick not in by_name:
        landscape = [s for s in scored
                     if s.width / max(1, s.height) >= 1.4
                     and entries[s.file].get("category") in ("Landscape", "Street")]
        pool_ = landscape or [s for s in scored if s.width >= s.height]
        hero_pick = max(pool_, key=lambda s: s.score).file
    hero = None
    portrait = None
    portrait_src = next((n for n in excluded if "profile" in n.lower()), None)
    if not args.manifest_only:
        print(f"hero backdrop: {hero_pick}")
        hero = build_hero(slugs, hero_pick)
        if portrait_src:
            portrait = build_portrait(portrait_src)
            print(f"about portrait: {portrait_src}")
    elif MANIFEST.exists():
        previous_manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        hero = previous_manifest.get("hero")
        portrait = previous_manifest.get("portrait")

    # ---- 4. rank ---------------------------------------------------------
    # Ratings decide the order and then stay here. They are NOT published:
    # photos.json carries the resulting sequence and nothing else, so the
    # numbers never reach the browser (not in the DOM, not in devtools).
    ranked = []
    for name in names:
        s = by_name[name]
        info = entries[name]
        ranked.append({
            "src": name,
            "title": info.get("title") or Path(name).stem,
            "category": info.get("category") or "Uncategorised",
            "rating": round(min(100.0, max(0.0, s.score + boosts.get(name, 0.0))), 1),
            "boost": boosts.get(name, 0.0),
            "breakdown": s.components,
            "monochrome": s.monochrome,
        })

    pin_rank = {n: i for i, n in enumerate(pinned)}
    ranked.sort(key=lambda p: (pin_rank.get(p["src"], len(pinned)), -p["rating"],
                               p["title"]))

    # ---- 5. public manifest ---------------------------------------------
    photos = []
    for entry in ranked:
        name = entry["src"]
        s = by_name[name]
        d = derived.get((None, name))
        photos.append({
            "id": slugs[name],
            "src": name,
            "title": entry["title"],
            # Optional per-photo description. Empty means the accessible name
            # falls back to title + category, which identifies a photo but does
            # not describe it.
            "alt": (entries[name].get("alt") or "").strip(),
            "category": entry["category"],
            "width": s.width,
            "height": s.height,
            "aspect": round(s.width / max(1, s.height), 4),
            "monochrome": s.monochrome,
            "captured": s.captured,
            "lqip": (d or {}).get("lqip"),
            "widths": (d or {}).get("widths", list(GRID_WIDTHS)),
        })

    categories = ["All"] + sorted({p["category"] for p in photos})
    manifest = {
        "generated": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "siteUrl": SITE_URL,
        "mediaDir": "media",
        "gridWidths": list(GRID_WIDTHS),
        "lightboxEdge": LIGHTBOX_EDGE,
        "categories": categories,
        "hero": hero,
        "portrait": portrait,
        "stats": {"count": len(photos)},
        "photos": photos,
    }
    MANIFEST.write_text(json.dumps(manifest, indent=1), encoding="utf-8")

    # ---- 5b. projects manifest ------------------------------------------
    # Sequence order, never rating order. The cover is the only place a score
    # is consulted, and it is not published.
    project_out = []
    for proj in projects:
        alt_map = proj.get("alt") or {}
        undescribed = [f for f in proj["files"] if not alt_map.get(f)]
        if undescribed:
            print(f"warning: project '{proj['slug']}' has {len(undescribed)} frame(s) "
                  f"with no alt text: {', '.join(undescribed)}")

        photos_out = []
        for f in proj["files"]:
            s = proj["scored"][f]
            d = derived.get((proj["slug"], f))
            photos_out.append({
                "id": proj["slugs"][f],
                "src": f,
                "alt": alt_map.get(f) or "",
                "width": s.width,
                "height": s.height,
                "aspect": round(s.width / max(1, s.height), 4),
                "monochrome": s.monochrome,
                "lqip": (d or {}).get("lqip"),
                "widths": (d or {}).get("widths", list(GRID_WIDTHS)),
            })

        cover = proj.get("cover")
        if cover not in proj["files"]:
            if cover:
                print(f"warning: project '{proj['slug']}' cover '{cover}' is not in "
                      f"the folder — falling back to the highest-rated frame")
            cover = max(proj["files"], key=lambda f: proj["scored"][f].score)
        cover_id = proj["slugs"][cover]

        project_out.append({
            "slug": proj["slug"],
            "title": proj.get("title") or proj["slug"],
            "subtitle": proj.get("subtitle") or "",
            "summary": proj.get("summary") or "",
            "count": len(photos_out),
            "cover": cover_id,
            "coverAspect": next(p["aspect"] for p in photos_out if p["id"] == cover_id),
            "coverLqip": next(p["lqip"] for p in photos_out if p["id"] == cover_id),
            "photos": photos_out,
        })

    PROJECTS_MANIFEST.write_text(json.dumps(
        {"generated": time.strftime("%Y-%m-%dT%H:%M:%S"),
         "mediaDir": "media",
         "gridWidths": list(GRID_WIDTHS),
         "count": len(project_out),
         "projects": project_out},
        indent=1), encoding="utf-8")

    # ---- 6. private rating report ---------------------------------------
    # Your copy of the scores. Lives under tools/ (blocked from the deployed
    # site by _headers / vercel.json) and is never fetched by the page.
    ratings = [p["rating"] for p in ranked]
    RATINGS_REPORT.write_text(json.dumps({
        "generated": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "note": "Internal. Decides gallery order; never served to the browser.",
        "weights": {
            "sharpness": 18, "exposure": 14, "contrast": 12, "color": 12,
            "composition": 16, "isolation": 12, "technical": 16,
        },
        "summary": {
            "count": len(ranked),
            "highest": max(ratings),
            "lowest": min(ratings),
            "median": sorted(ratings)[len(ratings) // 2],
            "average": round(sum(ratings) / len(ratings), 1),
        },
        "ranking": [dict(rank=i + 1, **e) for i, e in enumerate(ranked)],
    }, indent=1), encoding="utf-8")

    icons = build_icons()
    print(f"icons        {', '.join(f'{s}px' for s in icons)} + maskable")

    write_sitemap(["/", "/portfolio", "/projects", "/about", "/contact"]
                  + [f"/projects/{p['slug']}" for p in project_out])

    # GitHub Pages has no rewrite rules, but it does serve 404.html for unknown
    # paths -- so an identical copy makes /portfolio and friends resolve there.
    # Netlify and Vercel use _redirects / vercel.json instead and ignore this.
    index = ROOT / "index.html"
    if index.exists():
        shutil.copyfile(index, ROOT / "404.html")

    out_bytes = sum(f.stat().st_size for f in MEDIA.glob("*") if f.is_file())
    src_bytes = sum((PHOTOS / n).stat().st_size for n in names)
    no_alt = sum(1 for p in photos if not p["alt"])
    print(f"\nphotos.json  {len(photos)} photos, order only "
          f"(no ratings published)")
    if no_alt:
        print(f"             {no_alt} without alt text — their accessible name "
              f"falls back to title + category")
    print(f"{RATINGS_REPORT.relative_to(ROOT).as_posix()}  ratings "
          f"{min(ratings):.1f}-{max(ratings):.1f}, "
          f"median {sorted(ratings)[len(ratings) // 2]:.1f}  [internal]")
    if out_bytes:
        print(f"media/       {out_bytes / 1e6:.1f} MB of derivatives "
              f"from {src_bytes / 1e6:.0f} MB of originals "
              f"({src_bytes / max(out_bytes, 1):.0f}x smaller)")
    print("gallery order, top 5:")
    for i, p in enumerate(ranked[:5], 1):
        print(f"   {i}. {p['title']} ({p['category']})   [{p['rating']:.1f}]")
    if project_out:
        print(f"\nprojects.json  {len(project_out)} project(s):")
        for p in project_out:
            print(f"   {p['slug']:<16} {p['count']:>2} photos, "
                  f"cover {p['cover']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
