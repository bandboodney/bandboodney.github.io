# Band Boodney — boodney.band

Multilingual (RU/EN/DE/UK) concert site, built with [Eleventy](https://www.11ty.dev/)
and deployed to GitHub Pages.

## Develop

    npm install
    npm run serve     # http://localhost:8080
    npm run build     # → _site/
    npm test          # build + assert output

## Add or update a concert

1. Run `npm run new-event -- YYYY-MM-DD` — it scaffolds
   `src/_data/events/YYYY-MM-DD.json` prefilled from the most recent event
   (venue, times, price, repertoire) and prints the remaining steps. Or add
   the file by hand:
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

The layout also embeds a `MusicEvent` JSON-LD block for the upcoming show
(name, DST-aware `startDate`/`doorTime`, venue `PostalAddress`, performer,
`Offer` price). The timezone-qualified datetimes are derived in
`src/_data/shows.js` (`berlinOffset`/`localDateTime`, Europe/Berlin), and the
structured address parts (`street`/`postalCode`/`city`/`country`) live on the
event's `venue` in `src/_data/events/*.json`.

## Between-gigs mode

Once the last event date passes, `shows.upcoming` becomes `null` and the site
switches automatically to a holding page: band logo instead of the poster,
generic per-language title/description, `MusicGroup` JSON-LD instead of
`MusicEvent`, and no order flow (the order modal, price and venue blocks live
inside `{% if event %}` branches). The setlist modal keeps showing the latest
past show. To announce the next concert, add a new
`src/_data/events/YYYY-MM-DD.json` with a future `date` — everything (details,
tickets, `MusicEvent` JSON-LD) reactivates on the next build.

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
