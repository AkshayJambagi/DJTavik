/* ============================================================
   DJ TAVIK - Gallery
   Auto-discovers images from assets/img/gallery/, reads event
   info from the filename, sorts newest -> oldest, renders and
   wires the lightbox. Accepts any image type (jpg, png, gif,
   webp, avif, svg, bmp...).

   FILENAME FORMAT (delimiter is a double underscore "__"):

     YYYY-MM-DD__Event-Title__Venue__City.ext

   - Use hyphens "-" for spaces inside a field.
   - Date must be YYYY-MM-DD (used for sorting + display).
   - Venue and City are optional; you can stop after any field:
       2026-05-18__Magnetic-Fields-Festival.jpg
       2026-05-18__Magnetic-Fields-Festival__Alsisar-Palace.png
       2026-05-18__Magnetic-Fields-Festival__Alsisar-Palace__Rajasthan.gif

   HOW DISCOVERY WORKS (designed for GitHub Pages hosting):
   1. GitHub Contents API - lists the folder straight from your
      repo, so just committing new images makes them appear. No
      server and no manifest to maintain.
   2. gallery/manifest.json - optional static fallback list.
   3. Directory listing - only for local dev servers (Live Server).

   >>> CONFIG: set your GitHub owner/repo below (or leave blank to
       auto-detect from a *.github.io project-page URL). <<<
   ============================================================ */
(function () {
  "use strict";

  const CONFIG = {
    owner: "",   // e.g. "ajambagi" (leave "" to auto-detect on GitHub Pages)
    repo: "",    // e.g. "djtavik"  (leave "" to auto-detect on GitHub Pages)
    branch: "main",
  };

  const GALLERY_DIR = "assets/img/gallery/";
  const IMG_RE = /\.(jpe?g|png|gif|webp|avif|svg|bmp|jfif|apng)$/i;
  const DELIM = "__";

  const grid = document.getElementById("gallery-grid");
  const statusEl = document.getElementById("gallery-status");
  const lightbox = document.querySelector(".lightbox");
  if (!grid) return;

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  function humanize(s) {
    return (s || "").replace(/-/g, " ").trim();
  }

  function formatDate(d) {
    return d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear();
  }

  function parse(filename) {
    const dot = filename.lastIndexOf(".");
    const base = dot >= 0 ? filename.slice(0, dot) : filename;
    const parts = base.split(DELIM);

    const rawDate = (parts[0] || "").trim();
    const d = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? new Date(rawDate + "T00:00:00") : null;
    const validDate = d && !isNaN(d.getTime()) ? d : null;

    return {
      file: filename,
      date: validDate,
      title: humanize(parts[1]) || (validDate ? "Live Show" : humanize(base)),
      venue: humanize(parts[2]),
      city: humanize(parts[3]),
    };
  }

  async function discover() {
    // 1. GitHub Contents API (primary - works on GitHub Pages, auto-updates)
    const repo = detectRepo();
    if (repo) {
      const viaApi = await fromGitHubApi(repo);
      if (viaApi.length) return viaApi;
    }
    // 2. Optional static manifest (gallery/manifest.json)
    const viaManifest = await fromManifest();
    if (viaManifest.length) return viaManifest;
    // 3. Directory listing (local dev servers like Live Server only)
    return await fromDirListing();
  }

  function detectRepo() {
    if (CONFIG.owner && CONFIG.repo) {
      return { owner: CONFIG.owner, repo: CONFIG.repo };
    }
    // Auto-detect for GitHub Pages project pages: owner.github.io/repo/...
    const host = location.hostname;
    if (/\.github\.io$/i.test(host)) {
      const owner = host.replace(/\.github\.io$/i, "");
      const seg = location.pathname.split("/").filter(Boolean);
      if (seg.length && !/\.\w+$/.test(seg[0])) {
        return { owner: owner, repo: seg[0] };
      }
      // user/organization page (repo is owner.github.io)
      return { owner: owner, repo: owner + ".github.io" };
    }
    return null;
  }

  async function fromGitHubApi(repo) {
    try {
      const url =
        "https://api.github.com/repos/" + repo.owner + "/" + repo.repo +
        "/contents/" + GALLERY_DIR.replace(/\/+$/, "") +
        "?ref=" + encodeURIComponent(CONFIG.branch);
      const res = await fetch(url, {
        headers: { Accept: "application/vnd.github+json" },
        cache: "no-store",
      });
      if (!res.ok) return [];
      const data = await res.json();
      if (!Array.isArray(data)) return [];
      return data
        .filter(function (it) { return it.type === "file" && IMG_RE.test(it.name); })
        .map(function (it) { return it.name; });
    } catch (e) {
      return [];
    }
  }

  async function fromManifest() {
    try {
      const res = await fetch(GALLERY_DIR + "manifest.json", { cache: "no-store" });
      if (!res.ok) return [];
      const data = await res.json();
      const names = Array.isArray(data)
        ? data.map(function (x) { return typeof x === "string" ? x : x && x.file; })
        : [];
      return names.filter(function (n) { return n && IMG_RE.test(n); });
    } catch (e) {
      return [];
    }
  }

  async function fromDirListing() {
    try {
      const res = await fetch(GALLERY_DIR, { cache: "no-store" });
      if (!res.ok) return [];
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      const names = Array.from(doc.querySelectorAll("a"))
        .map(function (a) { return a.getAttribute("href") || ""; })
        .map(function (href) {
          try { href = decodeURIComponent(href); } catch (e) {}
          return href.split("?")[0].split("#")[0].replace(/\/+$/, "").split("/").pop();
        })
        .filter(function (name) { return name && IMG_RE.test(name); });
      return Array.from(new Set(names));
    } catch (e) {
      return [];
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function render(items) {
    grid.innerHTML = items.map(function (it) {
      const sub = [it.venue, it.city].filter(Boolean).join(", ");
      return (
        '<figure>' +
          '<img src="' + GALLERY_DIR + encodeURIComponent(it.file) + '" alt="' +
            escapeHtml(it.title + (sub ? " at " + sub : "")) + '" loading="lazy" />' +
          '<figcaption class="gallery-cap">' +
            (it.title ? '<span class="cap-title">' + escapeHtml(it.title) + '</span>' : '') +
            (sub ? '<span class="cap-sub">' + escapeHtml(sub) + '</span>' : '') +
            (it.date ? '<span class="cap-date">' + formatDate(it.date) + '</span>' : '') +
          '</figcaption>' +
        '</figure>'
      );
    }).join("");
  }

  /* ---------- Lightbox ---------- */
  function initLightbox() {
    const figures = Array.prototype.slice.call(grid.querySelectorAll("figure"));
    if (!figures.length || !lightbox) return;

    const lbImg = lightbox.querySelector("img");
    const btnClose = lightbox.querySelector(".lb-close");
    const btnPrev = lightbox.querySelector(".lb-prev");
    const btnNext = lightbox.querySelector(".lb-next");

    const sources = figures.map(function (fig) {
      const img = fig.querySelector("img");
      return { src: img.getAttribute("src"), alt: img.getAttribute("alt") || "" };
    });

    let current = 0;

    function show(i) {
      current = (i + sources.length) % sources.length;
      lbImg.setAttribute("src", sources[current].src);
      lbImg.setAttribute("alt", sources[current].alt);
    }
    function open(i) {
      show(i);
      lightbox.classList.add("open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }
    function close() {
      lightbox.classList.remove("open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    figures.forEach(function (fig, i) {
      fig.addEventListener("click", function () { open(i); });
    });
    btnClose.addEventListener("click", close);
    btnPrev.addEventListener("click", function () { show(current - 1); });
    btnNext.addEventListener("click", function () { show(current + 1); });
    lightbox.addEventListener("click", function (e) { if (e.target === lightbox) close(); });
    document.addEventListener("keydown", function (e) {
      if (!lightbox.classList.contains("open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") show(current - 1);
      else if (e.key === "ArrowRight") show(current + 1);
    });
  }

  /* ---------- Boot ---------- */
  discover().then(function (files) {
    if (!files.length) {
      if (statusEl) {
        statusEl.innerHTML =
          "No images found yet. Add photos to <code>assets/img/gallery/</code> and " +
          "commit them. If your repo isn't auto-detected, set <code>owner</code> and " +
          "<code>repo</code> at the top of <code>assets/js/gallery.js</code>.";
      }
      return;
    }

    const items = files.map(parse).sort(function (a, b) {
      if (a.date && b.date) return b.date - a.date;   // newest first
      if (a.date) return -1;
      if (b.date) return 1;
      return b.file.localeCompare(a.file);
    });

    render(items);
    if (statusEl) statusEl.style.display = "none";
    initLightbox();
  });
})();

