# Sana Bags - GitHub Pages Generator (Minimal)

This repo generates SEO-friendly static pages like:

- /backpacks-manufacturer-in-mumbai/
- /backpacks-manufacturer-in-pune/
- /schoolsbags-manufacturer-in-pune/

## Edit what gets generated

Open `data/config.json` and change:

- `basePath`: must be `/nkt` for your repo `nkt`
- `baseUrl`: must be `https://max-886-tech.github.io/nkt`
- `products` and `cities`
- `paragraphTemplate`

## How deployment works

Every push to `main` runs `.github/workflows/pages.yml`:
- runs `node scripts/generate.mjs`
- outputs website into `dist/`
- deploys `dist/` to GitHub Pages

## First time setup

GitHub repo → Settings → Pages → Source: **GitHub Actions**
