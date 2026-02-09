import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const cfgPath = path.join(repoRoot, "data", "config.json");
const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf-8"));

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

// Product pages
const tpl = fs.readFileSync(path.join(SRC, "template-product.html"), "utf-8");
const pages = [];

for (const product of cfg.products) {
  const productLabel = product.label;
  const productSlug = product.slug;
  const prefix = (product.samplePrefix || productSlug.toUpperCase()).replace(/[^A-Z0-9]/g,"");
  const fallbackCount = Number(product.sampleCount || 9);

  // Real images folder: src/img/<productSlug>/
  const imgDir = path.join(SRC_IMG, productSlug);
  const realFiles = listImages(imgDir);

  // Use real files if present, else placeholders count
  const useFiles = realFiles.length > 0
    ? realFiles
    : Array.from({ length: fallbackCount }, () => null);

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

    const paragraph = cfg.paragraphTemplate
      .replaceAll("{{PRODUCT}}", productLabel)
      .replaceAll("{{CITY}}", cityLabel);

    const pagePath = `${cfg.basePath}/${routeSlug}/`;
    const canonical = `${cfg.baseUrl}/${routeSlug}/`;

    // ✅ Build gallery here so canonical exists
    const galleryItems = [];
    for (let i = 0; i < useFiles.length; i++) {
      const code = `${prefix}-${String(i+1).padStart(3,"0")}`;

      let imgSrc = "";
      const alt = `${code} - ${productLabel}`;

      if (realFiles.length > 0) {
        imgSrc = `${cfg.basePath}/img/${productSlug}/${useFiles[i]}`;
      } else {
        imgSrc = placeholder(code);
      }

      const waUrl = waLink(
        site.whatsappNumber,
        `Hi Sana Bags, I want ${code} (${productLabel}) in ${cityLabel}. Page: ${canonical}`
      );

      const btn = waUrl
        ? `<a class="code-btn" href="${waUrl}" target="_blank" rel="noopener">${code}</a>`
        : `<span class="code-btn">${code}</span>`;

      galleryItems.push(`
        <div class="item">
          <img src="${imgSrc}" alt="${alt}" loading="lazy">
          ${btn}
        </div>
      `);
    }

    const htmlOut = render(tpl, {
      BASE: cfg.basePath,
      TITLE: title,
      H1: h1,
      INTRO: intro,
      PARAGRAPH: paragraph,
      PATH: pagePath,
      CANONICAL_URL: canonical,
      GALLERY_HTML: galleryItems.join("\n"),
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
