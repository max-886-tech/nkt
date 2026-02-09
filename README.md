# Sana Bags - Generator v4 (Real local images per product)

## ✅ Real image folders (what you asked)
Put your real images here:

- `src/img/backpacks/img-1.jpg`
- `src/img/backpacks/img-2.png`
- `src/img/laptopbags/img-1.jpg`
- `src/img/schoolsbags/img-1.webp`

The generator will:
- check `src/img/<productSlug>/`
- if it exists and contains images, it will use those images on every city page for that product
- if the folder is missing or empty, it falls back to placeholder images

## URL example
For:
`/laptopbags-manufacturer-in-goa/`
It will show images from:
`/img/laptopbags/` (because product slug is `laptopbags`)

## Deploy
Repo → Settings → Pages → Source: **GitHub Actions**
Push to `main` → Actions builds `dist/` and deploys.

## Edit products/cities
`data/config.json`
