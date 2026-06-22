# Band Boodney — boodney.band

Multilingual (RU/EN/DE/UK) concert site, built with [Eleventy](https://www.11ty.dev/)
and deployed to GitHub Pages.

## Develop

    npm install
    npm run serve     # http://localhost:8080
    npm run build     # → _site/
    npm test          # build + assert output

## Add or update a concert

1. Add a file under `src/_data/events/` named `YYYY-MM-DD.json`.
   - **Upcoming:** include `venue`, `doorsOpen`, `startTime`, `price`, `poster`,
     `repertoire`. **Do not** include `setlist` — it stays a surprise.
   - **Past:** after the gig, add a `setlist`. The most recent past event's setlist
     auto-appears in the "last time" modal.
2. Drop the poster image in `src/assets/img/` and reference its filename in `poster`.
3. UI labels live in `src/_data/i18n/{ru,en,de,uk}.json` — edit a string once per language.

To add a language: drop a new `<code>.json` dict in `src/_data/i18n/` (include a
`metaDescription`), add
`{ "code": "<code>", "permalink": "/<code>.html", "href": "/<code>.html", "locale": "<xx_XX>" }`
to `src/_data/languages.json`, and add its `Intl` locale to `LOCALES` in
`src/_data/shows.js`. The `href` (clean URL) and `locale` feed canonical, `hreflang`
and Open Graph tags automatically.

## SEO

`src/_includes/layouts/base.njk` emits per-language canonical, `hreflang`
(+`x-default`), Open Graph and Twitter Card tags. `src/sitemap.njk` →
`/sitemap.xml` and `src/robots.njk` → `/robots.txt` are generated at build from
`languages.json` and `site.url`. The QR `scanner.html` is `noindex` and excluded
from the sitemap. Absolute URLs come from `site.url` in `src/_data/site.json`.

## Deploy

Push to `main`; the GitHub Actions workflow builds and deploys automatically.

> **One-time setup:** In repo Settings → Pages, set **Source = GitHub Actions**
> (not "Deploy from a branch").

## Scanner

The QR check-in tool is `src/tools/scanner/index.html`, served unchanged at
`/scanner.html`.

## Out of scope / not in this repo

The order backend (Google Apps Script `order.gs`) lives in Google's console and is
referenced by `src/assets/js/order.js`.
