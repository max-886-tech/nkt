import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const cfgPath = path.join(repoRoot, "data", "config.json");
const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf-8"));

const catalogPath = path.join(repoRoot, "data", "catalog.json");
const catalog = fs.existsSync(catalogPath)
  ? JSON.parse(fs.readFileSync(catalogPath, "utf-8"))
  : { items: [] };

const SRC = path.join(repoRoot, "src");
const DIST = path.join(repoRoot, "dist");
const SRC_IMG = path.join(SRC, "img");
const DIST_IMG = path.join(DIST, "img");

function waNumber(raw){
  return String(raw || "").replace(/\D/g, ""); // digits only
}
function waLink(number, text){
  const n = waNumber(number);
  if (!n) return "";
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}

function ensureDir(p){ fs.mkdirSync(p, { recursive: true }); }
function emptyDir(p){
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
  fs.mkdirSync(p, { recursive: true });
}
function copyDir(srcDir, dstDir){
  ensureDir(dstDir);
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const s = path.join(srcDir, entry.name);
    const d = path.join(dstDir, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}
function render(tpl, vars){
  let out = tpl;
  for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{{${k}}}`, String(v));
  return out;
}
function titleCaseWords(s){
  return s.split(/\s+/).filter(Boolean).map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(" ");
}
function placeholder(text){
  return `https://placehold.co/900x900?text=${encodeURIComponent(text)}`;
}
function telify(phone){
  return phone.replace(/\s+/g,"").replace(/[()]/g,"");
}
function listImages(dir){
  if (!fs.existsSync(dir)) return [];
  const exts = new Set([".jpg",".jpeg",".png",".webp",".gif"]);
  return fs.readdirSync(dir)
    .filter(f => exts.has(path.extname(f).toLowerCase()))
    .sort((a,b)=>a.localeCompare(b, undefined, { numeric:true, sensitivity:"base" }));
}

const site = cfg.site || {};
const TOP_EMAIL = site.topEmail || "info@example.com";
const TOP_PHONE = site.topPhone || "+91 90000 00000";
const TOP_PHONE_TEL = telify(TOP_PHONE);
const FOOTER_ADDRESS = site.footerAddress || "Mumbai, India";

const FILTERS = cfg.filters || {};
const FILTER_MATERIAL = FILTERS.material || ["Nylon", "Polyester", "Canvas", "Leather"];
const FILTER_USECASE = FILTERS.useCase || ["School / College", "Office / Corporate", "Travel", "Outdoor"];

const FAQ = Array.isArray(cfg.faq) && cfg.faq.length
  ? cfg.faq
  : [
      {
        q: "What is the minimum order quantity (MOQ)?",
        a: "MOQ depends on design and customization. Share your requirement and we’ll confirm quickly."
      },
      {
        q: "Can you add my institute/company logo?",
        a: "Yes. We support logo printing / embroidery, color changes and custom branding."
      },
      {
        q: "Do you deliver across India?",
        a: "Yes. We ship across India. Delivery time depends on location and order quantity."
      }
    ];

emptyDir(DIST);

// Copy assets
copyDir(path.join(SRC, "assets"), path.join(DIST, "assets"));

// Copy all images (if any) from src/img -> dist/img
if (fs.existsSync(SRC_IMG)) copyDir(SRC_IMG, DIST_IMG);

// Copy partials so the browser can fetch them
if (fs.existsSync(path.join(SRC, "partials"))) {
  copyDir(path.join(SRC, "partials"), path.join(DIST, "partials"));
}

// Static pages
for (const page of ["index.html", "about.html", "contact.html"]) {
  const html = fs.readFileSync(path.join(SRC, page), "utf-8");
  const rendered = render(html, {
    BASE: cfg.basePath,
    TOP_EMAIL, TOP_PHONE, TOP_PHONE_TEL, FOOTER_ADDRESS
  });
  fs.writeFileSync(path.join(DIST, page), rendered, "utf-8");
}

// Product pages (template like screenshot)
const tpl = fs.readFileSync(path.join(SRC, "template-product.html"), "utf-8");
const pages = [];

const filterCfg = cfg.filters || {};
const filterMaterials = filterCfg.material || ["Nylon", "Polyester", "Canvas", "Leather"];
const filterUsecases = filterCfg.useCase || ["School / College", "Corporate", "Travel", "Outdoor"];

const faqs = (cfg.faq && Array.isArray(cfg.faq) && cfg.faq.length)
  ? cfg.faq
  : [
      { q: "What is the minimum order quantity (MOQ)?", a: "MOQ depends on design and customization. Send your requirement and we'll confirm quickly." },
      { q: "Can you add my institute/company logo?", a: "Yes. We support logo printing and embroidery depending on the material." },
      { q: "Do you deliver across India?", a: "Yes, we ship across India. Delivery time depends on quantity and customization." }
    ];

function buildFilterList(items){
  return items.map((label, idx)=>{
    const id = `f-${idx}-${label.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`;
    return `<label class="check"><input type="checkbox" id="${id}"> <span>${label}</span></label>`;
  }).join("\n");
}

function buildFaqHtml(list){
  return list.map((it, i)=>{
    const open = i === 0 ? " open" : "";
    return `
      <details class="faq-item"${open}>
        <summary>${it.q}<span aria-hidden="true">▾</span></summary>
        <div class="faq-body">${it.a}</div>
      </details>
    `;
  }).join("\n");
}

function buildProductCards(items, { productLabel, cityLabel, canonical }){
  const cards = [];
  for (const it of items) {
    const code = it.code || "CODE";
    const name = it.name || `${productLabel} (${code})`;
    const tagline = it.tagline || "";
    const moq = Number(it.moq || 0);
    const imgSrc = it.image || placeholder(code);
    const alt = `${code} - ${productLabel}`;

    const waUrl = waLink(
      site.whatsappNumber,
      `Hi Sana Bags, I want ${code} (${productLabel}) in ${cityLabel}. Page: ${canonical}`
    );

    const quote = waUrl
      ? `<a class="btn primary" href="${waUrl}" target="_blank" rel="noopener">Request a Quote</a>`
      : `<span class="btn primary">Request a Quote</span>`;

    const codeEl = waUrl
      ? `<a class="code-pill" href="${waUrl}" target="_blank" rel="noopener">${code}</a>`
      : `<span class="code-pill">${code}</span>`;

    cards.push(`
      <article class="product-card" data-card data-name="${String(name).replaceAll('"','&quot;')}" data-moq="${moq}">
        <div class="product-media">
          ${codeEl}
          <img src="${imgSrc}" alt="${alt}" loading="lazy">
        </div>
        <div class="product-body">
          <h3 class="product-name">${name}</h3>
          <p class="product-tagline">${tagline}</p>
          <div class="product-meta">
            <span>MOQ: <strong>${moq || "—"}</strong></span>
            ${quote}
          </div>
        </div>
      </article>
    `);
  }
  return cards.join("\n");
}

for (const product of cfg.products) {
  const productLabel = product.label;
  const productSlug = product.slug;

  // Items for this product category from catalog.json
  const productItems = (catalog.items || []).filter(i => (i.category || "") === productSlug);

  for (const city of cfg.cities) {
    const cityLabel = city.label;
    const routeSlug = `${productSlug}-manufacturer-in-${city.slug}`;
    const outDir = path.join(DIST, routeSlug);
    ensureDir(outDir);

    const h1 = `${titleCaseWords(productLabel)} manufacturer in ${cityLabel}`;
    const title = `${h1} | ${cfg.brand}`;

    const intro = (cfg.introTemplate || "")
      .replaceAll("{{PRODUCT}}", productLabel)
      .replaceAll("{{CITY}}", cityLabel);

    const paragraph = (cfg.paragraphTemplate || "")
      .replaceAll("{{PRODUCT}}", productLabel)
      .replaceAll("{{CITY}}", cityLabel);

    const canonical = `${cfg.baseUrl}/${routeSlug}/`;

    const quoteHref = waLink(
      site.whatsappNumber,
      `Hi Sana Bags, I want a bulk quote for ${productLabel} in ${cityLabel}. Page: ${canonical}`
    ) || "#";

    const breadcrumb = [
      `<a href="${cfg.basePath}/index.html">Home</a>`,
      `<a href="${cfg.basePath}/index.html">Shop</a>`,
      `<span aria-current="page">${h1}</span>`
    ].join(`<span class="sep">/</span>`);

    const chips = [
      { label: "Bulk Orders", cls: "green" },
      { label: "Customization", cls: "blue" },
      { label: "Durable Materials", cls: "gray" },
      { label: "Fast Delivery", cls: "orange" }
    ].map(c => `<span class="chip ${c.cls}">${c.label}</span>`).join("\n");

    const heroImg = productItems[0]?.image || placeholder(productLabel);
    const heroAlt = h1;

    const resultCount = productItems.length
      ? `Showing <strong>${productItems.length}</strong> results`
      : `No products added yet (add items in <code>data/catalog.json</code>)`;

    const cardsHtml = buildProductCards(productItems, { productLabel, cityLabel, canonical });

    const htmlOut = render(tpl, {
      BASE: cfg.basePath,
      TITLE: title,
      H1: h1,
      INTRO: intro,
      CANONICAL_URL: canonical,

      BREADCRUMB_HTML: breadcrumb,
      CHIPS_HTML: chips,
      HERO_IMAGE_SRC: heroImg,
      HERO_IMAGE_ALT: heroAlt,

      FILTER_CATEGORY_HTML: buildFilterList(cfg.products.map(p => p.label)),
      FILTER_MATERIAL_HTML: buildFilterList(filterMaterials),
      FILTER_USECASE_HTML: buildFilterList(filterUsecases),

      QUOTE_HREF: quoteHref,
      RESULT_COUNT_TEXT: resultCount,
      PRODUCT_CARDS_HTML: cardsHtml,
      PARAGRAPH: paragraph,
      FAQ_HTML: buildFaqHtml(faqs),

      TOP_EMAIL, TOP_PHONE, TOP_PHONE_TEL, FOOTER_ADDRESS
    });

    fs.writeFileSync(path.join(outDir, "index.html"), htmlOut, "utf-8");
    pages.push({ loc: canonical });
  }
}

// .nojekyll + sitemap + robots
fs.writeFileSync(path.join(DIST, ".nojekyll"), "", "utf-8");

const robots = `User-agent: *
Allow: /
Sitemap: ${cfg.baseUrl}/sitemap.xml
`;
fs.writeFileSync(path.join(DIST, "robots.txt"), robots, "utf-8");

const lastmod = new Date().toISOString().split("T")[0];
const sitemap =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  `  <url><loc>${cfg.baseUrl}/</loc><lastmod>${lastmod}</lastmod></url>\n` +
  `  <url><loc>${cfg.baseUrl}/about.html</loc><lastmod>${lastmod}</lastmod></url>\n` +
  `  <url><loc>${cfg.baseUrl}/contact.html</loc><lastmod>${lastmod}</lastmod></url>\n` +
  pages.map(p => `  <url><loc>${p.loc}</loc><lastmod>${lastmod}</lastmod></url>`).join("\n") +
  `\n</urlset>\n`;

fs.writeFileSync(path.join(DIST, "sitemap.xml"), sitemap, "utf-8");

console.log(`Generated ${pages.length} pages into /dist`);
