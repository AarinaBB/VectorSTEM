(function () {
  const page = document.querySelector(".page");

  // Page transitions (Wix-like feel)
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;

    const href = a.getAttribute("href");
    if (!href) return;

    const isExternal =
      a.target === "_blank" ||
      href.startsWith("http") ||
      href.startsWith("mailto:");
    if (isExternal) return;

    if (href.startsWith("#")) return; // allow anchors

    e.preventDefault();
    page?.classList.add("exit");
    setTimeout(() => (window.location.href = href), 180);
  });

  // Active nav highlight
  const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll(".nav a").forEach((el) => {
    const href = (el.getAttribute("href") || "").toLowerCase();
    if (href === path) el.classList.add("active");
    if (path === "" && href === "index.html") el.classList.add("active");
  });

  // Reveal on scroll
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((en) => en.isIntersecting && en.target.classList.add("on")),
    { threshold: 0.12 }
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  // Helpers
  async function fetchJSON(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load ${url}`);
    return await res.json();
  }

  // Courses page dynamic
  async function initCourses() {
    const grid = document.querySelector("[data-courses-grid]");
    const panel = document.querySelector("[data-details-panel]");
    if (!grid || !panel) return;

    const data = await fetchJSON("data/courses.json");
    const cats = data.categories || [];

    grid.innerHTML = cats
      .map(
        (c) => `
      <article class="card course-card" data-course="${c.id}">
        <img src="${c.image}" alt="${c.title}" loading="lazy"/>
        <div class="meta">
          <div>
            <h3 class="title">${c.title}</h3>
            <p class="summary">${c.summary || ""}</p>
          </div>
          <div class="details-pill">Details</div>
        </div>
      </article>
    `
      )
      .join("");

    let activeId = null;

    function renderPanel(cat) {
      const d = cat.details || {};
      const links = (d.links || [])
        .map((x) => `<a class="link-chip" href="${x.href}">${x.label}</a>`)
        .join("");

      const bullets = (d.bullets || []).map((b) => `<li>${b}</li>`).join("");

      panel.innerHTML = `
        <h3>${cat.title} — Details</h3>
        <p>${d.lead || ""}</p>
        <ul>${bullets}</ul>
        <div class="links">${links}</div>
      `;
    }

    function closePanel() {
      activeId = null;
      panel.classList.remove("open");
      panel.innerHTML = "";
    }

    grid.addEventListener("click", (e) => {
      const card = e.target.closest("[data-course]");
      if (!card) return;

      const id = card.getAttribute("data-course");
      if (!id) return;

      // toggle
      if (activeId === id) {
        closePanel();
        return;
      }

      const cat = cats.find((x) => x.id === id);
      if (!cat) return;

      activeId = id;
      renderPanel(cat);
      panel.classList.add("open");
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    // Close on Escape
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") closePanel();
    });

    // Close when clicking outside the grid/panel
    document.addEventListener("click", (ev) => {
      if (!activeId) return;
      const inside = ev.target.closest("[data-courses-grid], [data-details-panel]");
      if (!inside) closePanel();
    });
  }

  // Recordings page dynamic
  async function initRecordings() {
    const wrap = document.querySelector("[data-recordings]");
    if (!wrap) return;

    const data = await fetchJSON("data/recordings.json");
    const items = data.items || [];

    if (!items.length) {
      wrap.innerHTML = `<p class="sub">Recordings will appear here as soon as the first sessions are published.</p>`;
      return;
    }

    wrap.innerHTML = items
      .map(
        (r) => `
        <div class="card" style="padding:16px">
          <strong>${r.title}</strong>
          <div class="small">${r.date || ""} ${r.duration ? "• " + r.duration : ""}</div>
          ${r.note ? `<p class="small">${r.note}</p>` : ""}
          ${r.url ? `<a class="btn" href="${r.url}" target="_blank" rel="noopener">Watch</a>` : ""}
        </div>
      `
      )
      .join("");
  }

  initCourses().catch(console.error);
  initRecordings().catch(console.error);
})();
