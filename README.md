# Lensverse Photography

Portfolio site for Varun Mandepudi — Boston, MA.

A static site with a build step. Full-resolution originals live in `Photos/`;
a Python script rates every photograph, generates responsive AVIF/WebP
derivatives, and writes a manifest (`photos.json`) that the page reads. The
gallery appears in strongest-first order — **but the ratings themselves are
internal and never reach the browser.**

```
python tools/build.py     # rate + encode + write photos.json   (~50s for 77 photos)
python tools/serve.py     # dev server at http://localhost:8124
```

Requires Python 3.11+ with `pillow` and `numpy`. Nothing else — no Node, no
bundler, no CDN dependencies beyond the two webfonts.

---

## The rating engine (internal)

`tools/score_photos.py` measures seven qualities on every image and combines
them into a score out of 100. It runs offline and is deterministic: the same
photograph always earns the same number.

| Metric | Weight | What it measures |
| --- | --- | --- |
| `sharpness` | 18 | 90th-percentile Laplacian variance across an 8×8 tile grid — *peak* local detail, so shallow depth of field and deliberately soft backgrounds are not penalised |
| `technical` | 16 | Resolution and a sane aspect ratio; demotes anything low-res |
| `composition` | 16 | Rule-of-thirds placement of the salient mass, or strong left/right symmetry — whichever scores better. Penalised when the subject is jammed into the frame edge |
| `exposure` | 14 | Histogram entropy (tonal coverage) minus a clipping penalty. Up to 0.5% crushed blacks and blown highlights is treated as normal |
| `contrast` | 12 | 1st-to-99th percentile luminance spread plus standard deviation |
| `color` | 12 | Hasler–Süsstrunk colourfulness. **Monochrome frames fall back to tonal separation**, so good black and white is not buried |
| `isolation` | 12 | Mean edge energy inside the top saliency quartile vs outside — a proxy for how cleanly the subject separates from its background |

The weighted sum is blended 50/50 with its percentile rank. Both terms are
monotonic in the raw score, so **ordering is unchanged** — the rescale only
spreads the numbers into a readable band instead of a meaningless cluster.

Current spread across 77 photographs: **58.4 – 94.2, median 79.9**.

### Where the scores live

The ratings decide the order and then stop. They are **not published**:

- `photos.json` contains the resulting *sequence* and nothing else — no score,
  no rank, no per-metric breakdown. Verified by grep: the strings `rating`,
  `breakdown`, `sharpness`, `composition` and `isolation` do not appear in it.
- The page has no score badges, no ranking numbers, no explainer panel, and the
  order dropdown reads **Featured**, not "Top rated".
- Your copy of the numbers is `tools/ratings.report.json` — full ranking with
  every per-metric breakdown. It is never fetched by the page, and `_redirects`
  / `vercel.json` block `/tools/`, `/content/` and `/Photos/` from the deployed
  site.

To see the scores, open that report or run the scorer directly:

```
python tools/score_photos.py
```

### Overriding the automatic order

The score is a starting point, not a verdict. `content/photos.meta.json`:

```jsonc
"curation": {
  "pin":   ["36.jpg", "12.jpg"],           // forced to the front, in this order
  "boost": { "15.jpg": 6, "9.jpg": -4 }    // add/subtract points
}
```

Visitors can also re-sort to **Newest first** (from EXIF `DateTimeOriginal`) or
**Title A–Z**.

---

## Adding, removing and renaming photos

1. Drop the file into `Photos/`.
2. Add an entry to `content/photos.meta.json`:

   ```jsonc
   "83.jpg": { "title": "Harbour Light", "category": "Landscape" }
   ```

3. Run `python tools/build.py`.

The build warns loudly about both failure modes:

- listed in the metadata but missing from disk → skipped, name reported
- present on disk but not listed → will not appear, name reported

Those warnings matter when you renumber files: a name can survive while the
photo behind it changes, so re-check titles after any bulk rename.

To retire a photo, delete its entry (the original stays on disk). To keep a file
out of the gallery — like the About portrait — add it to `exclude`; it still
gets optimised derivatives if it is the portrait.

Categories are derived from the `category` values you use, so adding a new one
(`Wildlife`, say) needs no code change. `--clean` empties `media/` first.

---

## Project layout

```
index.html                  markup for all four views
404.html                    generated copy of index.html (GitHub Pages routing)
assets/styles.css           all styling; dark + light themes from one token set
assets/app.js               router, gallery, lightbox, theme, form
photos.json                 GENERATED — order, dimensions, LQIP. No ratings.
og-image.jpg                GENERATED — 1200×630 social card
sitemap.xml robots.txt      GENERATED
content/photos.meta.json    titles, categories, curation  ← you edit this
Photos/                     full-resolution originals (never served)
media/                      GENERATED — 708 derivatives (81 MB)
tools/build.py              the build
tools/score_photos.py       the rating engine (runnable on its own)
tools/ratings.report.json   GENERATED — internal scores, not served
tools/serve.py              dev server with production-like route fallback
_redirects _headers         Netlify / Cloudflare config
vercel.json                 Vercel config
```

Anything marked GENERATED is rewritten by `tools/build.py`. Do not hand-edit it.

---

## Performance

The originals average ~10 MB each (20 MP). They are never served. The build
emits AVIF and WebP at 400/800/1200 px wide for the grid, a 2000 px long-edge
version for the lightbox, and one 800 px JPEG as a fallback. The About portrait
and the hero backdrop get the same treatment.

| | Before | After |
| --- | --- | --- |
| Whole gallery at grid resolution | 797 MB | **5.2 MB** |
| Cold load, `/portfolio` | ~61 MB before first paint | **858 KB** |
| Cold load, `/` | — | **637 KB** |
| Typical grid image | ~10 MB | 69 KB |
| Lightbox image | up to 26 MB | ~190 KB |
| About portrait | 3.5 MB original | 28 KB AVIF |
| CLS | failing | **0** |

Measured in-browser on a cold load: 12 of 77 gallery images fetched, 65
deferred; no hero or portrait bytes on `/portfolio` at all.

Two non-obvious things keep that working, both easy to regress:

- Tiles are positioned with `top`/`left`, **not** `transform`, and the geometry
  is applied *before* insertion. Native lazy loading is evaluated against
  layout position during first layout; a transform leaves every tile at 0,0 for
  that check and the browser eagerly fetches the whole gallery.
- The hero's `srcset` lives in `data-*` and is hydrated by JS only when the home
  view is shown. A hidden `<img>` with a real `src` is still downloaded —
  `loading="lazy"` does *not* defer inside `display: none`.

EXIF is stripped from every derivative, so **GPS coordinates in the originals
are never published**.

---

## Accessibility

- Every gallery tile is a real `<button>`, reachable and operable by keyboard
- Masonry is positioned by JS but tiles stay in DOM order, so tab order,
  screen-reader order and visual order all agree
- Each tile announces its title, category and position (`"3 of 77"`)
- The lightbox is a native `<dialog>`: platform focus trap, Escape handling and
  background inerting. Arrow keys and touch swipe navigate
- The mobile drawer sets `inert` on the rest of the page, closes on Escape and
  restores focus to its button
- `prefers-reduced-motion` disables all reveal, hover and scroll animation
- Skip link, visible focus rings, live-region announcements on filter and route
  changes, labelled form fields with inline errors

## SEO

Real URLs (`/portfolio`, `/about`, `/contact`) via the History API, with
per-route `<title>`, description and canonical. Open Graph and Twitter cards,
JSON-LD (`Person` + `WebSite` + `ImageGallery`), sitemap, robots.txt, favicon.

Opened directly off the filesystem (`file://`) the router falls back to hash
URLs — but browsers block `fetch()` of a local JSON file, so the gallery cannot
load its manifest and says so. Use `python tools/serve.py` for local work.

---

## Deploying

Push the folder. Config for the three common hosts is committed:

- **Netlify / Cloudflare Pages** — `_redirects` and `_headers`
- **Vercel** — `vercel.json`
- **GitHub Pages** — `404.html` is a build-generated copy of `index.html`, which
  is how Pages resolves client-side routes

Currently live at **https://varunmandy.github.io/Lensverse-Page/**.

### Deploy directory

GitHub Pages *project* sites are served from `/<repo>/`, not the domain root.
`assets/app.js` detects that at load (`BASE`) and every route and asset URL is
built from it, so the same files work at a root and under a subpath — verified
against `/`, `/Lensverse-Page/` and nested paths. Do not replace those with
root-absolute paths: pushing to a bare `/portfolio` moves the document out of
the deploy directory and every relative `media/…` URL then 404s.

`.nojekyll` is present so Pages copies the tree verbatim instead of running it
through Jekyll (which ignores `_`-prefixed paths and adds minutes to a build
with 700 media files).

### Moving to a custom domain

Two places, then rebuild:

1. `SITE_URL` in `tools/build.py` — feeds the sitemap, robots.txt and og:image
2. the absolute URLs in `index.html` (canonical, `og:url`, `#site-url`, JSON-LD)

The router needs no change; it derives the base from wherever it is served.

⚠️ GitHub Pages has no deny rules, so `/tools/ratings.report.json` would be
publicly readable there. If you deploy to Pages and want the scores private,
move that file outside the published folder (or host on Netlify/Vercel, where
the committed config already blocks it).

## Contact form

Posts to [Web3Forms](https://web3forms.com). The access key is public by design
for that service. A hidden `botcheck` honeypot silently discards bot
submissions; add Web3Forms' own captcha if spam becomes a problem. Failures fall
back to showing the direct email address rather than a dead end.

---

## Known follow-ups

- The original React draft (`photography-portfolio.jsx`) has been deleted —
  `index.html` is the single source of truth. If you ever port to React, build
  it against `photos.json` rather than resurrecting that file; it predates the
  rating engine and the whole image pipeline.
- "5+ years" and "30+ projects" on the About page are placeholders carried over
  from the original site. Confirm or correct them.
- 77 photographs is a long single-column scroll on a phone. Fine for the genre
  now that images lazy-load, but pagination is an option if it starts to feel
  heavy.
