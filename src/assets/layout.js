window.__SITE_READY__ = (async function () {
  const meta = document.querySelector('meta[name="site-base"]');
  let base = (meta?.content || "").trim().replace(/\/$/, "");

  async function tryLoadJSON(url) {
    try {
      const res = await fetch(url, { cache: "no-cache" });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  // Load config (try /data/config.json OR /config.json)
  const cfg =
    (base ? await tryLoadJSON(`${base}/data/config.json`) : null) ||
    (base ? await tryLoadJSON(`${base}/config.json`) : null) ||
    (await tryLoadJSON(`./data/config.json`)) ||
    (await tryLoadJSON(`./config.json`)) ||
    {};

  // If meta base is empty or {{BASE}}, derive from config
  if (!base || base.includes("{{")) {
    base = String(cfg.basePath || "").replace(/\/$/, "");
  }

  const site = cfg.site || {};
  const social = site.social || {};
  const brand = cfg.brand || cfg.siteName || "Sana Bags";
  const digitsOnly = (s) => String(s || "").replace(/\D/g, "");

  const VARS = {
    BASE: base,
    YEAR: String(new Date().getFullYear()),
    SITE_NAME: brand,

    TOP_EMAIL: site.topEmail || "",
    TOP_PHONE: site.topPhone || "",
    TOP_PHONE_TEL: digitsOnly(site.topPhone || ""),
    TOP_PHONE_2: site.topPhone2 || "",

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
    SOCIAL_LINKEDIN: social.linkedin || "#",

    WHATSAPP_NUMBER: digitsOnly(site.whatsappNumber || "")
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

  function replaceVarsInDOM() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue && node.nodeValue.includes("{{")) {
        node.nodeValue = replaceVarsInString(node.nodeValue);
      }
    }
    document.querySelectorAll("*").forEach((el) => {
      for (const attr of Array.from(el.attributes || [])) {
        if (attr.value && attr.value.includes("{{")) {
          el.setAttribute(attr.name, replaceVarsInString(attr.value));
        }
      }
    });
  }

  // Inject header/footer if placeholders exist
  const headerHost = document.getElementById("site-header");
  const footerHost = document.getElementById("site-footer");

  if (headerHost) {
    const headerHtml = await loadPartial(`${base}/partials/header.html`);
    headerHost.innerHTML = replaceVarsInString(headerHtml);
  }

  if (footerHost) {
    const footerHtml = await loadPartial(`${base}/partials/footer.html`);
    footerHost.innerHTML = replaceVarsInString(footerHtml);
  }

  replaceVarsInDOM();

  return { cfg, base, vars: VARS, replaceVarsInString };
})();
