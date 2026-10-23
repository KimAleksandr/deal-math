# Deal Math — multilingual discount calculator

Static site: **EN, RU, KY, KK, UZ** · GitHub Pages or Cloudflare Pages · $0 hosting.

## Features

- Single discount, stacked discounts, % from two prices
- Restore original price from sale + %
- VAT/tax after discount
- Quantity × unit price with discount
- Compare two offers
- Copy result · share URL with prefilled numbers
- Partner links via `config.js`

## Local preview

```powershell
cd discount-tool
npx --yes serve .
```

Open the URL shown (needs HTTP for ES modules).

## Partner links

```powershell
copy config.example.js config.js
```

Edit URLs. `config.js` is gitignored — for Cloudflare/GitHub deploy, use **Pages environment** or commit a private repo only.

## Deploy — GitHub Pages (recommended)

1. Push repo to GitHub.
2. **Settings → Pages → Build and deployment → Source:** GitHub Actions.
3. Push to `main` — workflow `.github/workflows/deal-math-pages.yml` publishes `discount-tool/`.
4. Site: `https://<user>.github.io/<repo>/` if repo root is only discount-tool, or configure custom path.

If the whole monorepo is `pay-router`, enable Pages from Actions; artifact path is already `discount-tool`.

## Deploy — Cloudflare Pages (free)

1. [dash.cloudflare.com](https://dash.cloudflare.com) → Workers & Pages → Create → Connect Git **or** Direct Upload.
2. Project name e.g. `deal-math` → build output directory: `discount-tool` (or upload folder contents).
3. Optional CLI (after `npx wrangler login`):

```powershell
cd discount-tool
npx wrangler pages deploy . --project-name=deal-math
```

Public URL: `https://deal-math.pages.dev` (after first deploy; update `sitemap.xml` / canonical if name differs).

## SEO

- Google Search Console → submit `sitemap.xml`
- AdSense → paste script into `#ad-top` in `index.html`
