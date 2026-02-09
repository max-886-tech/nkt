import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const cfgPath = path.join(repoRoot, "data", "config.json");
const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf-8"));

const SRC = path.join(repoRoot, "src");
const DIST = path.join(repoRoot, "dist");

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function emptyDir(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
  fs.mkdirSync(p, { recursive: true });
}

function copyDir(srcDir, dstDir) {
  ensureDir(dstDir);
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const s = path.join(srcDir, entry.name);
    const d = path.join(dstDir, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function render(tpl, vars) {
  let out = tpl;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{{${k}}}`, String(v));
  }
  return out;
}

function titleCaseWords(s) {
  return s
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

emptyDir(DIST);

// Copy assets
copyDir(path.join(SRC, "assets"), path.join(DIST, "assets"));

// Copy static pages (replace {{BASE}})
for (const page of ["index.html", "about.html", "contact.html"]) {
  const html = fs.readFileSync(path.join(SRC, page), "utf-8");
  const rendered = render(html, { BASE: cfg.basePath });
  fs.writeFileSync(path.join(DIST, page), rendered, "utf-8");
}

// Product pages
const tpl = fs.readFileSync(path.join(SRC, "template-product.html"), "utf-8");

const pages = [];
for (const product of cfg.products) {
  for (const city of cfg.cities) {
    const slug = `${product.slug}-manufacturer-in-${city.slug}`;
    const outDir = path.join(DIST, slug);
    ensureDir(outDir);

    const productText = product.label;
    const cityText = city.label;

    const h1 = `${titleCaseWords(productText)} manufacturer in ${cityText}`;
    const title = `${h1} | ${cfg.brand}`;
    const paragraph = cfg.paragraphTemplate
      .replaceAll("{{PRODUCT}}", productText)
      .replaceAll("{{CITY}}", cityText);

    const pagePath = `${cfg.basePath}/${slug}/`;
    const canonical = `${cfg.baseUrl}/${slug}/`;

    const html = render(tpl, {
      BASE: cfg.basePath,
      TITLE: title,
      H1: h1,
      PARAGRAPH: paragraph,
      PATH: pagePath,
      CANONICAL_URL: canonical
    });

    fs.writeFileSync(path.join(outDir, "index.html"), html, "utf-8");
    pages.push({ loc: canonical });
  }
}

// .nojekyll helps if you later add folders starting with underscore
fs.writeFileSync(path.join(DIST, ".nojekyll"), "", "utf-8");

// robots + sitemap
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

console.log(`Generated ${pages.length} product pages into /dist`);
