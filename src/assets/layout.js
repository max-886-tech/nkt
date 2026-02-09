(async function () {
  const meta = document.querySelector('meta[name="site-base"]');
  const base = (meta?.content || "").replace(/\/$/, "");

  const headerHost = document.getElementById("site-header");
  const footerHost = document.getElementById("site-footer");

  const replaceVars = (html) => {
    return html
      .replaceAll("{{BASE}}", base)
      .replaceAll("{{YEAR}}", String(new Date().getFullYear()));
  };

  async function loadPartial(url) {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) return "";
    return await res.text();
  }

  // Load + inject
  if (headerHost) {
    const headerHtml = await loadPartial(`${base}/partials/header.html`);
    headerHost.innerHTML = replaceVars(headerHtml);

    // active link
    const p = location.pathname;
    const setActive = (key) => {
      headerHost.querySelectorAll("[data-nav]").forEach(a => a.removeAttribute("aria-current"));
      const el = headerHost.querySelector(`[data-nav="${key}"]`);
      if (el) el.setAttribute("aria-current", "page");
    };

    if (p.endsWith("/about.html")) setActive("about");
    else if (p.endsWith("/contact.html")) setActive("contact");
    else if (p.endsWith("/") || p.endsWith("/index.html")) setActive("home");
  }

  if (footerHost) {
    const footerHtml = await loadPartial(`${base}/partials/footer.html`);
    footerHost.innerHTML = replaceVars(footerHtml);
  }
})();
