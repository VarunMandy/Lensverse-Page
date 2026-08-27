/* ==========================================================================
   Lensverse Photography
   Router, rating-ordered gallery, lightbox, theme and contact form.
   No dependencies. Everything degrades to readable HTML without JS.
   ========================================================================== */

(() => {
  "use strict";

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v === null ? fallback : v; }
      catch { return fallback; }
    },
    set(key, value) { try { localStorage.setItem(key, value); } catch { /* private mode */ } },
  };

  /* ======================================================================
     Theme
     ====================================================================== */

  const Theme = {
    init() {
      const saved = store.get("lv-theme", null);
      const system = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
      this.apply(saved || system, false);

      window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", (e) => {
        if (!store.get("lv-theme", null)) this.apply(e.matches ? "light" : "dark", false);
      });

      $("#theme-toggle")?.addEventListener("click", () => {
        const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
        this.apply(next, true);
      });
    },
    apply(theme, persist) {
      document.documentElement.dataset.theme = theme;
      $('meta[name="theme-color"]')?.setAttribute("content", theme === "light" ? "#fbfaf8" : "#0a0a0c");
      const btn = $("#theme-toggle");
      if (btn) {
        btn.setAttribute("aria-label",
          theme === "light" ? "Switch to dark theme" : "Switch to light theme");
        btn.setAttribute("aria-pressed", String(theme === "light"));
      }
      if (persist) store.set("lv-theme", theme);
    },
  };

  /* ======================================================================
     Router

     Real URLs when served over http(s) so every view is linkable, indexable
     and works with the back button. Falls back to hash routing when the page
     is opened straight off the disk (file://), where pushState is blocked.
     ====================================================================== */

  const ROUTES = {
    home: {
      title: "Lensverse Photography — Varun Mandepudi, Boston",
      description: "Portrait, fashion, event, street and landscape photography by Varun Mandepudi, based in Boston, Massachusetts.",
    },
    portfolio: {
      title: "Portfolio — Lensverse Photography",
      description: "Selected photography by Varun Mandepudi — portraits, fashion, live music, street, landscape and wildlife, shot in Boston and beyond.",
    },
    projects: {
      title: "Projects — Lensverse Photography",
      description: "Complete shoots and commissioned work by Varun Mandepudi, each presented as a sequence rather than a grid.",
    },
    about: {
      title: "About — Lensverse Photography",
      description: "Varun Mandepudi is a photographer in Boston working across portrait, fashion, event, street and landscape work.",
    },
    contact: {
      title: "Contact — Lensverse Photography",
      description: "Commission a portrait, event or editorial shoot with Lensverse Photography in Boston, Massachusetts.",
    },
  };

  /* The directory the site is deployed under.

     At a domain root this is "/". On a GitHub Pages *project* site it is
     "/<repo>/" — and getting this wrong is not a cosmetic bug: pushState to a
     root-absolute "/portfolio" moves the document out of the deploy directory,
     after which every relative asset URL (media/…, photos.json) resolves
     against the wrong origin path and 404s.

     Detected once, at load, before anything calls pushState. */
  const BASE = (() => {
    if (location.protocol === "file:") return "";
    const segs = location.pathname.split("/").filter(Boolean);
    // Scan left to right for the first known route name; everything before it
    // is the deploy directory. Popping from the right cannot work once routes
    // are nested -- "/repo/projects/cloka-clc" would swallow the slug into the
    // base and every asset URL would 404.
    const idx = segs.findIndex((s) => ROUTES[s.toLowerCase()]);
    const baseSegs = idx >= 0
      ? segs.slice(0, idx)
      : segs.filter((s) => !s.includes("."));  // drop index.html / 404.html
    return baseSegs.length ? `/${baseSegs.join("/")}/` : "/";
  })();

  /** Resolve a project-relative asset path against the deploy directory. */
  const asset = (path) => (BASE === "" ? path : BASE + path);

  const Router = {
    useHash: location.protocol === "file:",
    current: null,

    init() {
      document.addEventListener("click", (e) => {
        const link = e.target.closest("a[data-route]");
        if (!link || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        this.go(link.dataset.route, link.dataset.slug || null);
      });

      window.addEventListener("popstate", () => this.render(this.read(), false));
      window.addEventListener("hashchange", () => {
        if (this.useHash) this.render(this.read(), false);
      });

      this.render(this.read(), false);
    },

    /** @returns {{route: string, slug: string|null}} */
    read() {
      let raw;
      if (this.useHash) {
        raw = location.hash.replace(/^#\/?/, "");
      } else {
        raw = location.pathname;
        if (BASE !== "/" && raw.toLowerCase().startsWith(BASE.toLowerCase())) {
          raw = raw.slice(BASE.length);
        }
        raw = raw.replace(/^\/+|\/+$/g, "");
      }
      const parts = raw.split("/").filter(Boolean);
      const name = (parts[0] || "").toLowerCase();
      if (!ROUTES[name]) return { route: "home", slug: null };
      return {
        route: name,
        slug: parts[1] ? decodeURIComponent(parts[1]).toLowerCase() : null,
      };
    },

    /** Route path, relative and with no leading slash or deploy directory. */
    path(route, slug) {
      if (route === "home") return "";
      return slug ? `${route}/${encodeURIComponent(slug)}` : route;
    },

    /** URL to navigate to — includes the deploy directory. */
    href(route, slug) {
      const p = this.path(route, slug);
      if (this.useHash) return p ? `#/${p}` : "#/";
      return BASE + p;
    },

    go(route, slug) {
      if (!ROUTES[route]) { route = "home"; slug = null; }
      if (route === this.current && (slug || null) === (this.currentSlug || null)) {
        window.scrollTo({ top: 0, behavior: reduceMotion.matches ? "auto" : "smooth" });
        return;
      }
      const url = this.href(route, slug);
      if (this.useHash) location.hash = url;
      else history.pushState({ route, slug }, "", url);
      this.render({ route, slug }, true);
    },

    transitioning: false,

    render(route, isNavigation) {
      const target = typeof route === "string" ? { route, slug: null } : route;
      if (!ROUTES[target.route]) { target.route = "home"; target.slug = null; }
      const paint = () => this.paint(target.route, target.slug, isNavigation);

      const canAnimate = isNavigation && !reduceMotion.matches
        && document.startViewTransition && !this.transitioning;
      if (!canAnimate) {
        paint();
        return;
      }

      this.transitioning = true;
      const transition = document.startViewTransition(paint);
      // A transition started while another is finishing gets skipped, which
      // rejects these promises. That is expected, not an error -- but leaving
      // them unhandled surfaces as an uncaught InvalidStateError.
      const settle = () => { this.transitioning = false; };
      transition.ready.catch(() => {});
      transition.updateCallbackDone.catch(() => {});
      transition.finished.then(settle, settle);
    },

    paint(route, slug, isNavigation) {
      this.current = route;
      this.currentSlug = slug || null;

      $$("[data-view]").forEach((section) => {
        section.hidden = section.dataset.view !== route;
      });

      $$("a[data-route]").forEach((link) => {
        const active = link.dataset.route === route;
        if (link.classList.contains("nav__link")) {
          if (active) link.setAttribute("aria-current", "page");
          else link.removeAttribute("aria-current");
        }
      });

      let meta = ROUTES[route];
      document.title = meta.title;
      $('meta[name="description"]')?.setAttribute("content", meta.description);
      $('meta[property="og:title"]')?.setAttribute("content", meta.title);
      $('meta[property="og:description"]')?.setAttribute("content", meta.description);

      // Trailing slash matters: it makes the site URL a directory to resolve
      // the route segment against, rather than a file to replace.
      const siteRoot =
        ($("#site-url")?.content || location.origin).replace(/\/+$/, "") + "/";
      const canonicalUrl = new URL(this.path(route, slug), siteRoot).href;
      $('link[rel="canonical"]')?.setAttribute("href", canonicalUrl);
      $('meta[property="og:url"]')?.setAttribute("content", canonicalUrl);

      Nav.close();
      Masthead.sync(route);

      if (route === "home") Hero.hydrate();

      if (route === "portfolio") {
        Gallery.ensure();
        // A gallery built while this section was hidden has no layout yet.
        requestAnimationFrame(() => Gallery.layout());
      }

      if (route === "projects") Projects.show(slug);

      if (isNavigation) {
        window.scrollTo({ top: 0, behavior: "auto" });
        // Move focus to the new view so screen readers and keyboards land in
        // the right place instead of staying on the nav link.
        const el = $(`[data-view="${route}"]`);
        if (el) {
          el.setAttribute("tabindex", "-1");
          el.focus({ preventScroll: true });
          el.addEventListener("blur", () => el.removeAttribute("tabindex"), { once: true });
        }
        Announce.say(`${document.title.split("—")[0].trim()} view loaded`);
      }

      Reveal.scan();
    },
  };

  /* ======================================================================
     Manifest

     One fetch, shared by the gallery and by any [data-stat] counters, so the
     numbers on the About page can never drift from what is actually published.
     ====================================================================== */

  const Manifest = {
    promise: null,
    load() {
      if (!this.promise) {
        // Default caching so the <link rel="preload"> in the head is reused;
        // freshness is handled by the Cache-Control header on photos.json.
        this.promise = fetch(asset("photos.json")).then((res) => {
          if (!res.ok) throw new Error(`photos.json responded ${res.status}`);
          return res.json();
        });
      }
      return this.promise;
    },
  };

  const Stats = {
    fill(data) {
      const values = {
        photos: data.stats.count,
        categories: data.categories.filter((c) => c !== "All").length,
      };
      $$("[data-stat]").forEach((el) => {
        const value = values[el.dataset.stat];
        if (value !== undefined) el.textContent = value;
      });
    },
  };

  /* ======================================================================
     Hero backdrop

     Applied on first view of the home route rather than shipped in the markup,
     so a cold landing on /portfolio, /about or /contact never downloads it.
     ====================================================================== */

  const Hero = {
    done: false,
    hydrate() {
      if (this.done) return;
      const media = $("#hero-media");
      if (!media) return;
      this.done = true;

      $$("source[data-srcset]", media).forEach((source) => {
        source.srcset = source.dataset.srcset;
        source.removeAttribute("data-srcset");
      });
      const img = $("img[data-src]", media);
      if (img) {
        img.src = img.dataset.src;
        img.removeAttribute("data-src");
      }
    },
  };

  /* ======================================================================
     Masthead + mobile drawer
     ====================================================================== */

  const Masthead = {
    el: null,
    init() {
      this.el = $("#masthead");
      const onScroll = () => {
        const solid = window.scrollY > 24 || Router.current !== "home";
        this.el.dataset.solid = String(solid);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      this.onScroll = onScroll;
      onScroll();
    },
    sync() { this.onScroll?.(); },
  };

  const Nav = {
    btn: null, panel: null,
    init() {
      this.btn = $("#nav-toggle");
      this.panel = $("#primary-nav");
      this.btn?.addEventListener("click", () => this.toggle());
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && this.isOpen()) { this.close(); this.btn.focus(); }
      });
      window.matchMedia("(min-width: 52.0625rem)").addEventListener("change", (e) => {
        if (e.matches) this.close();
      });
    },
    isOpen() { return this.panel?.dataset.open === "true"; },
    toggle() { this.isOpen() ? this.close() : this.open(); },
    open() {
      this.panel.dataset.open = "true";
      this.btn.setAttribute("aria-expanded", "true");
      // keep the rest of the page out of the tab order while the drawer is up
      $("#main").inert = true;
      $("#footer").inert = true;
      // Wait a frame: the panel is still `visibility: hidden` in this tick, and
      // an invisible element refuses focus.
      requestAnimationFrame(() => $(".nav__link", this.panel)?.focus());
    },
    close() {
      if (!this.panel) return;
      this.panel.dataset.open = "false";
      this.btn?.setAttribute("aria-expanded", "false");
      const main = $("#main"), footer = $("#footer");
      if (main) main.inert = false;
      if (footer) footer.inert = false;
    },
  };

  /* ======================================================================
     Screen-reader announcements
     ====================================================================== */

  const Announce = {
    say(message) {
      const live = $("#live-region");
      if (!live) return;
      live.textContent = "";
      window.setTimeout(() => { live.textContent = message; }, 60);
    },
  };

  /* ======================================================================
     Reveal on scroll
     ====================================================================== */

  const Reveal = {
    observer: null,
    init() {
      if (reduceMotion.matches || !("IntersectionObserver" in window)) return;
      this.observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-visible");
          this.observer.unobserve(entry.target);
        }
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
      this.scan();
    },
    scan() {
      if (!this.observer) return;
      $$(".reveal:not(.is-visible)").forEach((el) => {
        if (el.closest("[data-view][hidden]")) return;
        this.observer.observe(el);
      });
    },
  };

  /* ======================================================================
     Gallery
     ====================================================================== */

  /* Column count is decided from the *container* width; `sizes` has to be
     expressed against the viewport. The container is the viewport minus two
     gutters (~55-112px), so these two lists describe the same breakpoints from
     the two different reference frames. Change them together.
       container <  560  -> 1 column   (viewport <  635)
       container <  900  -> 2 columns  (viewport <  990)
       container < 1320  -> 3 columns  (viewport < 1430)
       otherwise         -> 4 columns  (container caps at 84rem = 1344px) */
  const COLUMN_BREAKPOINTS = [560, 900, 1320];
  const TILE_SIZES =
    "(max-width: 635px) 92vw, (max-width: 990px) 45vw, (max-width: 1430px) 30vw, 330px";

  /* photos.json arrives already in curated order (the build ranks it), so
     "featured" just preserves the order it was given. Ratings themselves are
     never sent to the browser. */
  const SORTS = {
    featured: { label: "Featured", phrase: "in the curated order", fn: null },
    newest: {
      label: "Newest first",
      phrase: "newest first",
      fn: (a, b) => {
        if (a.captured && b.captured) return b.captured.localeCompare(a.captured);
        if (a.captured) return -1;
        if (b.captured) return 1;
        return 0;
      },
    },
    title: { label: "Title A–Z", phrase: "by title", fn: (a, b) => a.title.localeCompare(b.title) },
  };

  const Gallery = {
    data: null,
    photos: [],
    visible: [],
    started: false,
    columns: 0,
    state: {
      category: "All",
      sort: "featured",
    },

    ensure() {
      if (this.started) return;
      this.started = true;
      this.load();
    },

    async load() {
      const grid = $("#gallery");
      try {
        this.data = await Manifest.load();
      } catch (err) {
        grid.innerHTML = "";
        $("#gallery-empty").hidden = false;
        $("#gallery-empty").innerHTML =
          "<p>The gallery manifest could not be loaded.</p>" +
          "<p class=\"eyebrow\" style=\"margin-top:.75rem\">Run <code>python tools/build.py</code>, " +
          "then serve the folder over http rather than opening the file directly.</p>";
        console.error(err);
        return;
      }

      this.photos = this.data.photos;
      Stats.fill(this.data);
      this.buildFilters();
      this.buildSort();
      this.bindControls();
      this.apply();

      // Re-place tiles when the container changes width. ResizeObserver also
      // fires when the section becomes visible, which is how a gallery built
      // while hidden gets its first real layout.
      let frame = 0;
      new ResizeObserver(() => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => this.layout());
      }).observe(grid);
    },

    buildFilters() {
      const wrap = $("#filters");
      const counts = new Map();
      for (const p of this.photos) counts.set(p.category, (counts.get(p.category) || 0) + 1);

      wrap.innerHTML = "";
      for (const category of this.data.categories) {
        const total = category === "All" ? this.photos.length : counts.get(category) || 0;
        if (!total) continue;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "chip";
        btn.dataset.category = category;
        btn.setAttribute("aria-pressed", String(category === this.state.category));
        btn.innerHTML = `${category}<span class="chip__count">${total}</span>`;
        btn.addEventListener("click", () => {
          this.state.category = category;
          $$(".chip", wrap).forEach((c) =>
            c.setAttribute("aria-pressed", String(c.dataset.category === category)));
          this.apply();
        });
        wrap.append(btn);
      }
    },

    buildSort() {
      const select = $("#sort");
      select.innerHTML = "";
      for (const [key, cfg] of Object.entries(SORTS)) {
        const opt = document.createElement("option");
        opt.value = key;
        opt.textContent = cfg.label;
        select.append(opt);
      }
      select.value = this.state.sort;
    },

    bindControls() {
      $("#sort").addEventListener("change", (e) => {
        this.state.sort = SORTS[e.target.value] ? e.target.value : "featured";
        this.apply();
      });
    },

    apply() {
      const { category, sort } = this.state;
      this.visible = this.photos
        .filter((p) => category === "All" || p.category === category);
      // "featured" has no comparator: photos.json is already in curated order.
      if (SORTS[sort].fn) this.visible.sort(SORTS[sort].fn);

      // Position within the current view, used for the screen-reader label.
      this.visible.forEach((p, i) => { p._pos = i + 1; });

      this.paint();

      const scope = category === "All" ? "all categories" : category.toLowerCase();
      const summary =
        `${this.visible.length} photograph${this.visible.length === 1 ? "" : "s"} in ` +
        `${scope}, ${SORTS[sort].phrase}.`;
      $("#gallery-count").textContent = summary;
      Announce.say(summary);
    },

    columnCount(width) {
      return COLUMN_BREAKPOINTS.findIndex((bp) => width < bp) + 1 || COLUMN_BREAKPOINTS.length + 1;
    },

    /** Balanced-column geometry, from aspect ratios alone. No DOM reads. */
    geometry(width) {
      if (width < 80) return null;
      const gap = parseFloat(
        getComputedStyle($("#gallery")).getPropertyValue("--gallery-gap")) || 12;
      const cols = this.columnCount(width);
      const colWidth = (width - gap * (cols - 1)) / cols;
      const offsets = new Array(cols).fill(0);

      const boxes = this.visible.map((photo) => {
        let col = 0;
        for (let c = 1; c < cols; c += 1) if (offsets[c] < offsets[col] - 0.5) col = c;
        const height = Math.round(colWidth / (photo.aspect || 1));
        const box = {
          left: Math.round(col * (colWidth + gap)),
          top: Math.round(offsets[col]),
          height,
        };
        offsets[col] += height + gap;
        return box;
      });

      return { cols, colWidth, boxes, height: Math.round(Math.max(...offsets) - gap) };
    },

    place(tile, box, colWidth) {
      tile.style.width = `${colWidth}px`;
      tile.style.height = `${box.height}px`;
      // top/left rather than transform, and applied *before* the element is
      // inserted: native lazy loading is evaluated against layout position
      // during the first layout pass. A transform, or positioning applied
      // afterwards, leaves every tile at 0,0 for that check -- and the browser
      // then eagerly fetches all 67 images instead of the first screenful.
      tile.style.left = `${box.left}px`;
      tile.style.top = `${box.top}px`;
    },

    paint() {
      const grid = $("#gallery");
      const empty = $("#gallery-empty");
      grid.dataset.laidOut = "false";
      grid.replaceChildren();

      if (!this.visible.length) {
        empty.hidden = false;
        grid.style.height = "0px";
        return;
      }
      empty.hidden = true;

      const geom = this.geometry(grid.clientWidth);
      if (!geom) {
        // Section still hidden; ResizeObserver will call layout() once shown.
        this.needsPaint = true;
        return;
      }
      this.needsPaint = false;
      this.columns = geom.cols;

      const fragment = document.createDocumentFragment();
      this.visible.forEach((photo, index) => {
        const tile = this.tile(photo, index);
        this.place(tile, geom.boxes[index], geom.colWidth);
        fragment.append(tile);
      });

      grid.append(fragment);
      grid.style.height = `${geom.height}px`;
      grid.dataset.laidOut = "true";
    },

    /** Reposition existing tiles after a width change. */
    layout() {
      const grid = $("#gallery");
      const tiles = $$(".tile", grid);
      if (!tiles.length) {
        if (this.needsPaint) this.paint();
        return;
      }
      const geom = this.geometry(grid.clientWidth);
      if (!geom) return;
      this.columns = geom.cols;
      tiles.forEach((tile, i) => this.place(tile, geom.boxes[i], geom.colWidth));
      grid.style.height = `${geom.height}px`;
      grid.dataset.laidOut = "true";
    },

    tile(photo, index) {
      const dir = asset(this.data.mediaDir);
      const eager = index < 6;

      const srcset = (ext) => this.data.gridWidths
        .map((w) => `${dir}/${photo.id}-${w}.${ext} ${w}w`).join(", ");

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tile";
      btn.dataset.id = photo.id;
      btn.setAttribute("aria-label",
        `${photo.title}. ${photo.category}. ` +
        `${photo._pos} of ${this.visible.length}. Open larger view.`);

      btn.innerHTML = `
        <span class="tile__frame" style="background-image:url('${photo.lqip || ""}')">
          <picture>
            <source type="image/avif" srcset="${srcset("avif")}" sizes="${TILE_SIZES}">
            <source type="image/webp" srcset="${srcset("webp")}" sizes="${TILE_SIZES}">
            <img src="${dir}/${photo.id}-800.jpg" alt="${escapeAttr(photo.title)}"
                 width="${photo.width}" height="${photo.height}"
                 loading="${eager ? "eager" : "lazy"}"
                 ${eager ? 'fetchpriority="high"' : ""}
                 decoding="async">
          </picture>
        </span>
        <span class="tile__meta">
          <span>
            <span class="tile__title">${escapeHtml(photo.title)}</span>
            <span class="tile__category">${escapeHtml(photo.category)}</span>
          </span>
        </span>`;

      const img = $("img", btn);
      if (img.complete) img.classList.add("is-loaded");
      else img.addEventListener("load", () => img.classList.add("is-loaded"), { once: true });
      img.addEventListener("error", () => img.classList.add("is-loaded"), { once: true });

      btn.addEventListener("click", () =>
        Lightbox.open(this.visible, this.visible.indexOf(photo)));
      return btn;
    },
  };

  /* ======================================================================
     Projects

     A project is a body of work shown as a *sequence*, so it deliberately does
     not reuse the masonry grid: full-width frames in the order they were given,
     landscapes running wide and portraits paired. The rating engine never
     reorders a project -- filename order is the edit.
     ====================================================================== */

  const PROJECT_SIZES =
    "(max-width: 700px) 94vw, (max-width: 1100px) 88vw, 1100px";
  const PROJECT_PAIR_SIZES =
    "(max-width: 700px) 94vw, (max-width: 1100px) 44vw, 545px";

  const Projects = {
    data: null,
    loading: null,
    indexRendered: false,
    detailSlug: null,   // which project is currently in the DOM

    load() {
      if (!this.loading) {
        this.loading = fetch(asset("projects.json"))
          .then((res) => {
            if (!res.ok) throw new Error(`projects.json responded ${res.status}`);
            return res.json();
          })
          .then((data) => { this.data = data; return data; });
      }
      return this.loading;
    },

    async show(slug) {
      // The shell holds the index heading *and* the grid; the detail view
      // replaces both, so toggle the shell rather than just the grid.
      const shell = $("#projects-shell");
      const detail = $("#project-detail");
      let data;
      try {
        data = await this.load();
      } catch (err) {
        shell.hidden = false;
        detail.hidden = true;
        $("#projects-index").innerHTML =
          '<p class="gallery-empty">Projects could not be loaded. ' +
          'Run <code>python tools/build.py</code> and serve over http.</p>';
        console.error(err);
        return;
      }
      // A slower fetch can resolve after the visitor has moved on.
      if (Router.current !== "projects") return;

      const project = slug && data.projects.find((p) => p.slug === slug);
      if (slug && !project) {
        // Unknown slug: fall back to the index rather than showing nothing.
        Router.go("projects", null);
        return;
      }

      if (project) {
        shell.hidden = true;
        detail.hidden = false;
        this.renderDetail(project);
        document.title = `${project.title} — Lensverse Photography`;
        const desc = project.summary || ROUTES.projects.description;
        $('meta[name="description"]')?.setAttribute("content", desc);
        $('meta[property="og:title"]')?.setAttribute("content", document.title);
        $('meta[property="og:description"]')?.setAttribute("content", desc);
      } else {
        detail.hidden = true;
        shell.hidden = false;
        this.renderIndex(data.projects);
      }
      Reveal.scan();
    },

    renderIndex(projects) {
      const wrap = $("#projects-index");
      if (this.indexRendered) return;
      const dir = asset("media");

      wrap.innerHTML = projects.map((p) => {
        const srcset = (ext) => [400, 800, 1200]
          .map((w) => `${dir}/${p.cover}-${w}.${ext} ${w}w`).join(", ");
        return `
        <a class="project-card reveal" href="${Router.href("projects", p.slug)}"
           data-route="projects" data-slug="${escapeAttr(p.slug)}">
          <span class="project-card__frame" style="aspect-ratio:4 / 5;
                background-image:url('${p.coverLqip || ""}')">
            <picture>
              <source type="image/avif" srcset="${srcset("avif")}"
                      sizes="(max-width: 700px) 94vw, 46vw">
              <source type="image/webp" srcset="${srcset("webp")}"
                      sizes="(max-width: 700px) 94vw, 46vw">
              <!-- Covers are the whole point of this page and there are few of
                   them, so they are not deferred. -->
              <img src="${dir}/${p.cover}-800.jpg" alt="" decoding="async">
            </picture>
          </span>
          <span class="project-card__body">
            <span class="project-card__title">${escapeHtml(p.title)}</span>
            <span class="project-card__meta">${escapeHtml(p.subtitle)}</span>
            <span class="project-card__count">${p.count} frames</span>
          </span>
        </a>`;
      }).join("");
      this.indexRendered = true;
    },

    renderDetail(project) {
      const host = $("#project-detail");
      // Only skip when this exact project is already the one in the DOM.
      if (this.detailSlug === project.slug) return;
      const dir = asset("media");

      // The opening frames load eagerly: a project page is read top to bottom,
      // so the first thing on screen should not wait for an intersection
      // callback. Everything below the fold is deferred as usual.
      let shown = 0;
      const figure = (photo, paired) => {
        const eager = shown++ < 2;
        const sizes = paired ? PROJECT_PAIR_SIZES : PROJECT_SIZES;
        const srcset = (ext) => [400, 800, 1200]
          .map((w) => `${dir}/${photo.id}-${w}.${ext} ${w}w`).join(", ");
        return `
          <button type="button" class="project-shot${paired ? " project-shot--pair" : ""}"
                  data-id="${photo.id}"
                  aria-label="${escapeAttr(project.title)}. Open larger view.">
            <span class="project-shot__frame" style="aspect-ratio:${photo.width} / ${photo.height};
                  background-image:url('${photo.lqip || ""}')">
              <picture>
                <source type="image/avif" srcset="${srcset("avif")}" sizes="${sizes}">
                <source type="image/webp" srcset="${srcset("webp")}" sizes="${sizes}">
                <img src="${dir}/${photo.id}-800.jpg" alt="" decoding="async"
                     ${eager ? 'fetchpriority="high"' : 'loading="lazy"'}>
              </picture>
            </span>
          </button>`;
      };

      // Rhythm rules, in order:
      //   the opening frame always runs full width -- it is the establishing
      //     shot, and an all-portrait project would otherwise render as a flat
      //     two-column grid with no entry point
      //   landscapes always run full width
      //   consecutive portraits pair up
      const blocks = [];
      const photos = project.photos;
      for (let i = 0; i < photos.length;) {
        const p = photos[i];
        const next = photos[i + 1];
        const pairable = i > 0 && p.aspect < 0.95 && next && next.aspect < 0.95;
        if (pairable) {
          blocks.push(`<div class="project-pair">${figure(p, true)}${figure(next, true)}</div>`);
          i += 2;
        } else {
          blocks.push(`<div class="project-single">${figure(p, false)}</div>`);
          i += 1;
        }
      }

      host.innerHTML = `
        <div class="route-head shell-width">
          <p class="eyebrow reveal">
            <a href="${Router.href("projects", null)}" data-route="projects"
               class="project-back">Projects</a>
          </p>
          <h2 class="route-head__title reveal" data-delay="1">${escapeHtml(project.title)}</h2>
          <p class="project-detail__meta reveal" data-delay="2">
            ${escapeHtml(project.subtitle)} · ${project.count} frames
          </p>
          ${project.summary
            ? `<p class="route-head__lede reveal" data-delay="3">${escapeHtml(project.summary)}</p>`
            : ""}
        </div>
        <div class="project-flow shell-width">${blocks.join("")}</div>`;

      $$(".project-shot", host).forEach((btn) => {
        btn.addEventListener("click", () => {
          const i = project.photos.findIndex((p) => p.id === btn.dataset.id);
          Lightbox.open(project.photos, i, { label: project.title });
        });
      });

      $$("img", host).forEach((img) => {
        const done = () => img.classList.add("is-loaded");
        if (img.complete) done();
        else {
          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
        }
      });

      this.detailSlug = project.slug;
    },
  };

  /* ======================================================================
     Lightbox -- native <dialog>, so focus trapping, Escape and background
     inerting come from the platform rather than hand-rolled JS.
     ====================================================================== */

  const Lightbox = {
    dialog: null,
    index: 0,
    items: [],          // whatever set is being browsed: gallery or a project
    returnTo: null,     // element to restore focus to on close

    init() {
      this.dialog = $("#lightbox");
      if (!this.dialog) return;

      $("#lb-prev").addEventListener("click", () => this.step(-1));
      $("#lb-next").addEventListener("click", () => this.step(1));
      $("#lb-close").addEventListener("click", () => this.dialog.close());

      this.dialog.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight") { e.preventDefault(); this.step(1); }
        if (e.key === "ArrowLeft") { e.preventDefault(); this.step(-1); }
      });

      this.dialog.addEventListener("close", () => {
        document.body.style.removeProperty("overflow");
        // Prefer the thumbnail for whichever photo is showing now (arrow keys
        // may have moved on), falling back to whatever opened the dialog.
        const id = this.items[this.index]?.id;
        const back = (id && $(`[data-id="${id}"]`)) || this.returnTo;
        back?.focus({ preventScroll: false });
      });

      // Click the empty area around the photo to dismiss. <picture> fills the
      // stage, so it counts as backdrop too -- only the <img> itself does not.
      $("#lb-stage").addEventListener("click", (e) => {
        if (e.target === e.currentTarget || e.target.tagName === "PICTURE") {
          this.dialog.close();
        }
      });

      let startX = 0, startY = 0, tracking = false;
      const stage = $("#lb-stage");
      stage.addEventListener("pointerdown", (e) => {
        if (e.pointerType === "mouse") return;
        tracking = true; startX = e.clientX; startY = e.clientY;
      }, { passive: true });
      stage.addEventListener("pointerup", (e) => {
        if (!tracking) return;
        tracking = false;
        const dx = e.clientX - startX, dy = e.clientY - startY;
        if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.6) this.step(dx < 0 ? 1 : -1);
      }, { passive: true });
    },

    /**
     * @param {Array}  items  the set to browse (gallery selection or a project)
     * @param {number} index  which one to show
     * @param {object} [opts] { label } extra caption context, e.g. project title
     */
    open(items, index, opts = {}) {
      if (!items || !items.length || index < 0 || index >= items.length) return;
      this.items = items;
      this.index = index;
      this.label = opts.label || null;
      this.returnTo = document.activeElement;
      this.show();
      document.body.style.overflow = "hidden";
      if (!this.dialog.open) this.dialog.showModal();
    },

    step(delta) {
      const n = this.items.length;
      if (!n) return;
      this.index = (this.index + delta + n) % n;
      this.show();
    },

    show() {
      const photo = this.items[this.index];
      if (!photo) return;
      const dir = asset("media");

      $("#lb-avif").srcset = `${dir}/${photo.id}-full.avif`;
      $("#lb-webp").srcset = `${dir}/${photo.id}-full.webp`;

      const img = $("#lb-img");
      img.classList.remove("is-loaded");
      img.width = photo.width;
      img.height = photo.height;
      img.alt = photo.title || this.label || "";
      img.src = `${dir}/${photo.id}-800.jpg`;
      if (img.complete) img.classList.add("is-loaded");
      else img.addEventListener("load", () => img.classList.add("is-loaded"), { once: true });

      $("#lb-title").textContent = photo.title || this.label || "";
      $("#lb-sub").textContent =
        [photo.title ? photo.category : this.label,
         photo.monochrome ? "Black & white" : null,
         photo.captured ? photo.captured.slice(0, 10) : null].filter(Boolean).join(" · ");
      $("#lb-counter").textContent = `${this.index + 1} / ${this.items.length}`;

      // warm the neighbours so arrow-key browsing feels instant
      for (const offset of [1, -1]) {
        const next = this.items[(this.index + offset + this.items.length) % this.items.length];
        if (next && next.id !== photo.id) new Image().src = `${dir}/${next.id}-full.avif`;
      }
    },
  };

  /* ======================================================================
     Contact form
     ====================================================================== */

  const ContactForm = {
    init() {
      const form = $("#contact-form");
      if (!form) return;

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const status = $("#form-status");

        if (!this.validate(form)) {
          status.dataset.state = "error";
          status.textContent = "Please correct the highlighted fields.";
          return;
        }
        // Bots fill hidden inputs; humans cannot see this one.
        if (form.elements.botcheck.value) return;

        const btn = $("#form-submit", form);
        const label = btn.textContent;
        btn.disabled = true;
        btn.textContent = "Sending…";
        status.dataset.state = "";
        status.textContent = "";

        try {
          const res = await fetch("https://api.web3forms.com/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({
              access_key: form.elements.access_key.value,
              subject: "New enquiry from the Lensverse portfolio",
              from_name: "Lensverse Portfolio",
              name: form.elements.name.value.trim(),
              email: form.elements.email.value.trim(),
              message: form.elements.message.value.trim(),
            }),
          });
          const data = await res.json().catch(() => ({}));

          if (res.ok && data.success) {
            status.dataset.state = "ok";
            status.textContent = "Thank you — your message is on its way. I usually reply within two days.";
            form.reset();
          } else {
            throw new Error(data.message || `Request failed (${res.status})`);
          }
        } catch (err) {
          status.dataset.state = "error";
          status.textContent =
            "That did not send. Please email lensverse1@gmail.com directly and I will pick it up.";
          console.error(err);
        } finally {
          btn.disabled = false;
          btn.textContent = label;
        }
      });

      $$(".field input, .field textarea", form).forEach((input) => {
        input.addEventListener("blur", () => this.check(input));
        input.addEventListener("input", () => {
          if (input.closest(".field").dataset.invalid === "true") this.check(input);
        });
      });
    },

    check(input) {
      const field = input.closest(".field");
      const error = $(".field__error", field);
      const ok = input.checkValidity() && input.value.trim() !== "";
      field.dataset.invalid = String(!ok);
      input.setAttribute("aria-invalid", String(!ok));
      if (error) {
        error.textContent = ok ? "" : (input.validationMessage || "This field is required.");
      }
      return ok;
    },

    validate(form) {
      return $$(".field input, .field textarea", form)
        .map((input) => this.check(input))
        .every(Boolean);
    },
  };

  /* ======================================================================
     Helpers
     ====================================================================== */

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  const escapeAttr = escapeHtml;

  /* ======================================================================
     Boot
     ====================================================================== */

  function boot() {
    Theme.init();
    Masthead.init();
    Nav.init();
    Reveal.init();
    Lightbox.init();
    ContactForm.init();

    // point every in-app link at the routing scheme this environment supports
    $$("a[data-route]").forEach((a) => { a.href = Router.href(a.dataset.route); });

    Router.init();

    // The portfolio is the reason people are here, so warm its manifest even
    // when the visitor lands elsewhere -- and use it to fill the published
    // counts on the About page. Only the JSON: building the tiles while the
    // section is hidden would leave them without layout, and the browser would
    // then treat every lazy image as on-screen and fetch the whole gallery.
    if (Router.current !== "portfolio") {
      const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1200));
      idle(() => { Manifest.load().then((data) => Stats.fill(data)).catch(() => {}); });
    }

    document.documentElement.dataset.ready = "true";
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
