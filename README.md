# Sana Bags - Generator v3 (Nekton-like product page)

This version makes product pages closer to Nekton's structure:
- page title + breadcrumb
- grid gallery of sample images with codes (e.g., BACKPACK-001)
- content paragraph
- reviews section (dummy cards)
- footer with contact + office hours

## Edit
Open `data/config.json`:
- `products`: set `samplePrefix` and `sampleCount` per product
- optionally add `samples` array per product (to override placeholder images)
- `cities`
- `paragraphTemplate`

## Deploy
Repo → Settings → Pages → Source: **GitHub Actions**
Push to main → Actions builds `dist/` and deploys.
