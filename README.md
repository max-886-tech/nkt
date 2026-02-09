# Sana Bags - GitHub Pages Generator (Per-product images)

This repo generates SEO-friendly static pages like:
- /backpacks-manufacturer-in-mumbai/
- /laptopbags-manufacturer-in-goa/
- /schoolsbags-manufacturer-in-pune/

## Per-product images
In `data/config.json`, each product can define:
- `imageUrl`
- `imageAlt`

If missing, a placeholder image is used automatically.

## Deploy
Repo → Settings → Pages → Source: **GitHub Actions**
Every push to `main` regenerates and deploys the site from `dist/`.
