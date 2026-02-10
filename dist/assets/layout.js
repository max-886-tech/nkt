(async function () {
  // 1) Read meta base (may still be "{{BASE}}" in your HTML)
  const meta = document.querySelector('meta[name="site-base"]');
  let base = (meta?.content || "").trim().replace(/\/$/, "");

  // Helper: fetch JSON (returns null if not found)
  async function tryLoadJSON(url) {
    try {
      const res = await fetch(url, { cache: "no-cache" });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  // 2) Load config.json (try common paths)
  // If base is empty or still a placeholder, load config relative to the page first.
  const baseLooksInvalid = !base || base.includes("{{") || base.includes("}}");

  let cfg =
    (baseLooksInvalid ? null : await tryLoadJSON(`${base}/data/config.json`)) ||
    (baseLooksInvalid ? null : await tryLoadJSON(`${base}/config.json`)) ||
    (await tryLoadJSON(`./data/config.json`)) ||
    (await tryLoadJSON(`./config.json`)) ||
    {};

  // 3) If base wasn't set correctly, derive it from config
  if (baseLooksInvalid) {
    base = (cfg.basePath || "").replace(/\/$/, "");
  }

  const headerHost = document.getElementById("site-header");
  const footerHost = document.getElementById("site-footer");

  // Utilities
  const digitsOnly = (s) => String(s || "").replace(/\D/g, "");

  const brand = cfg.brand || cfg.siteName || "Sana Bags";
  const site = cfg.site || {};
  const social = site.social || {};

  // 4) Build variables map (add more anytime)
  const VARS = {
    BASE: base,
    YEAR: String(new Date().getFullYear()),

    SITE_NAME: brand,
    BRAND: brand,

    TOP_EMAIL: site.topEmail || "",
    TOP_PHONE: site.topPhone || "",
    TOP_PHONE_2: site.topPhone2 || "",
    TOP_PHONE_TEL: digitsOnly(site.topPhone || ""),

    FOOTER_ADDRESS: site.footerAddress || "",
    FOOTER_CITY: site.footerCity || "",

    FOOTER_ABOUT: site.footerAbout || "",
    FOOTER_TWEET_TEXT: site.tweetText || "",
    FOOTER_TWEET_DATE: site.tweetDate || "",

    WORKING_HOURS: site.workingHours || "",

    SOCIAL_FACEBOOK: social.facebook || "#",
    SOCIAL_TWITTER: social.twitter || "#",
    SOCIAL_INSTAGRAM: social.instagram || "#",
    SOCIAL_GOOGLE: social.google || "#",
    SOCIAL_DRIBBBLE: social.linkedin || "#"
  };

  const replaceVarsInString = (str) => {
    let out = String(str || "");
    for (const [k, v] of Object.entries(VARS)) {
      out = out.split(`{{${k}}}`).join(String(v));
    }
    return out;
  };

  async function loadPartial(url) {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) return "";
    return await res.text();
  }

  // Replace placeholders in existing page DOM (so contact.html placeholders work too)
  function replaceVarsInDOM(root = document) {
    // Replace text nodes
    const walker = document.createTreeWalker(root.body || root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const t = node.nodeValue;
      if (t && t.includes("{{")) node.nodeValue = replaceVarsInString(t);
    }

    // Replace attributes that may contain placeholders
    const elms = (root.body || root).querySelectorAll ? (root.body || root).querySelectorAll("*") : [];
    elms.forEach(el => {
      for (const attr of Array.from(el.attributes || [])) {
        if (attr.value && attr.value.includes("{{")) {
          el.setAttribute(attr.name, replaceVarsInString(attr.value));
        }
      }
    });
  }

  // 5) Inject header/footer partials
  if (headerHost) {
    const headerHtml = await loadPartial(`${base}/partials/header.html`);
    headerHost.innerHTML = replaceVarsInString(headerHtml);

    // active link (extend if you have more pages)
    const p = location.pathname;
    const setActive = (key) => {
      headerHost.querySelectorAll("[data-nav]").forEach(a => a.removeAttribute("aria-current"));
      const el = headerHost.querySelector(`[data-nav="${key}"]`);
      if (el) el.setAttribute("aria-current", "page");
    };

    if (p.endsWith("/about.html") || p.endsWith("/about-us.html")) setActive("about");
    else if (p.endsWith("/contact.html")) setActive("contact");
    else if (p.endsWith("/shop.html")) setActive("shop");
    else if (p.endsWith("/") || p.endsWith("/index.html")) setActive("home");
  }

  if (footerHost) {
    const footerHtml = await loadPartial(`${base}/partials/footer.html`);
    footerHost.innerHTML = replaceVarsInString(footerHtml);
  }

  // 6) Finally replace placeholders across the whole page
  replaceVarsInDOM(document);
})();
