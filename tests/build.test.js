const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const SITE = path.join(__dirname, "..", "_site");
const read = (p) => fs.readFileSync(path.join(SITE, p), "utf8");

test("assets and scanner pass through to preserved paths", () => {
  assert.ok(fs.existsSync(path.join(SITE, "assets/css/styles.css")), "styles.css");
  assert.ok(fs.existsSync(path.join(SITE, "assets/css/legal.css")), "legal.css");
  assert.ok(fs.existsSync(path.join(SITE, "assets/js/order.js")), "order.js");
  assert.ok(fs.existsSync(path.join(SITE, "assets/fonts/fonts.css")), "fonts.css");
  assert.ok(fs.existsSync(path.join(SITE, "assets/vendor/html5-qrcode.min.js")), "vendor");
  assert.ok(fs.existsSync(path.join(SITE, "assets/img/poster-2026-07-04.jpg")), "poster");
  assert.strictEqual(fs.existsSync(path.join(SITE, "scanner.html")), true, "/scanner.html preserved");
  assert.ok(fs.existsSync(path.join(SITE, "CNAME")), "CNAME");
  assert.ok(fs.existsSync(path.join(SITE, "favicon.ico")), "favicon.ico at root");
});

test("scanner is not double-emitted as a template", () => {
  assert.strictEqual(
    fs.existsSync(path.join(SITE, "tools/scanner/index.html")),
    false,
    "scanner should only exist at /scanner.html, not /tools/scanner/"
  );
});

test("all language pages are generated at preserved URLs", () => {
  for (const f of ["index.html", "en.html", "de.html", "uk.html"]) {
    assert.ok(fs.existsSync(path.join(SITE, f)), f + " missing");
  }
});

test("RU homepage renders RU labels and upcoming event facts", () => {
  const html = read("index.html");
  assert.match(html, /<html lang="ru">/);
  assert.match(html, /Площадка/);
  assert.match(html, /Kulturzentrum Gorod/);
  assert.match(html, /4 июля/);
  assert.match(html, /Заказать билеты/);
});

test("EN and DE pages render their own language", () => {
  assert.match(read("en.html"), /<html lang="en">/);
  assert.match(read("en.html"), /Order tickets/);
  assert.match(read("de.html"), /<html lang="de">/);
  assert.match(read("de.html"), /Veranstaltungsort/);
  assert.match(read("de.html"), /4\. Juli/);
});

test("UK page renders Ukrainian labels and localized date", () => {
  const html = read("uk.html");
  assert.match(html, /<html lang="uk">/);
  assert.match(html, /Локація/);
  assert.match(html, /Замовити квитки/);
  assert.match(html, /4 липня/);
  assert.match(html, /window\.OrderLang = 'uk'/);
});

test("Ukrainian switcher shows 'UA' label but keeps technical code 'uk'", () => {
  const html = read("uk.html");
  // Visible switcher label is UA (avoids UK = United Kingdom confusion)...
  assert.match(html, /lang="uk" hreflang="uk">UA</);
  // ...while the SEO-critical codes stay the valid ISO 639-1 'uk'.
  assert.match(html, /<html lang="uk">/);
  assert.match(html, /<link rel="alternate" hreflang="uk" href="https:\/\/boodney\.band\/uk\.html"/);
  assert.doesNotMatch(html, /hreflang="ua"/);
});

test("past setlist (not the upcoming event) renders inside the setlist modal", () => {
  const html = read("index.html");
  assert.match(html, /id="setlistModal"/);
  assert.match(html, /Сетлист · январь 2026/);
  // "Медведица" is only in the January setlist, never in the upcoming repertoire,
  // and must appear after the setlist modal opening (i.e. inside it).
  assert.match(html, /id="setlistModal"[\s\S]*Медведица/);
});

test("order i18n is injected per language", () => {
  assert.match(read("index.html"), /window\.OrderLang = 'ru'/);
  assert.match(read("de.html"), /window\.OrderLang = 'de'/);
  assert.match(read("de.html"), /Senden\.\.\./);
});

test("sitemap.xml lists every language URL and the legal pages", () => {
  const xml = read("sitemap.xml");
  assert.match(xml, /<loc>https:\/\/boodney\.band\/<\/loc>/);
  for (const p of ["en.html", "de.html", "uk.html", "impressum.html", "datenschutz.html"]) {
    assert.match(xml, new RegExp(`<loc>https://boodney\\.band/${p.replace(".", "\\.")}</loc>`));
  }
  assert.match(xml, /hreflang="uk"/);
  assert.match(xml, /hreflang="x-default"/);
});

test("robots.txt points at the sitemap and blocks the scanner", () => {
  const txt = read("robots.txt");
  assert.match(txt, /Sitemap: https:\/\/boodney\.band\/sitemap\.xml/);
  assert.match(txt, /Disallow: \/scanner\.html/);
});

test("each language page carries a self-canonical, hreflang and OG image", () => {
  const cases = [
    ["index.html", "https://boodney.band/"],
    ["en.html", "https://boodney.band/en.html"],
    ["de.html", "https://boodney.band/de.html"],
    ["uk.html", "https://boodney.band/uk.html"],
  ];
  for (const [file, canonical] of cases) {
    const html = read(file);
    assert.match(html, new RegExp(`<link rel="canonical" href="${canonical.replace(/\//g, "\\/")}"`), file + " canonical");
    assert.match(html, /<link rel="alternate" hreflang="x-default"/, file + " x-default");
    assert.match(html, /property="og:image" content="https:\/\/boodney\.band\/assets\/img\//, file + " og:image");
    assert.match(html, /name="twitter:card" content="summary_large_image"/, file + " twitter card");
  }
});

test("language switcher links to clean canonical URLs, never /index.html", () => {
  for (const f of ["index.html", "en.html", "de.html", "uk.html"]) {
    const html = read(f);
    // the RU switcher link must target "/" (the canonical), not the canonicalized "/index.html"
    assert.match(html, /<a href="\/" [^>]*hreflang="ru">/, f + " RU link points to /");
    assert.doesNotMatch(html, /href="\/index\.html"/, f + " must not link to /index.html");
  }
});

test("each language page embeds valid MusicEvent JSON-LD", () => {
  const cases = [
    ["index.html", "ru", "https://boodney.band/"],
    ["en.html", "en", "https://boodney.band/en.html"],
    ["de.html", "de", "https://boodney.band/de.html"],
    ["uk.html", "uk", "https://boodney.band/uk.html"],
  ];
  for (const [file, code, url] of cases) {
    const m = read(file).match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    assert.ok(m, file + " has a JSON-LD block");
    const ld = JSON.parse(m[1]); // throws if malformed
    assert.strictEqual(ld["@type"], "MusicEvent", file + " @type");
    assert.strictEqual(ld.url, url, file + " url is canonical");
    assert.strictEqual(ld.inLanguage, code, file + " inLanguage");
    assert.strictEqual(ld.startDate, "2026-07-04T19:30:00+02:00", file + " DST-aware startDate");
    assert.strictEqual(ld.location.address.addressLocality, "München", file + " locality");
    assert.strictEqual(ld.offers.priceCurrency, "EUR", file + " currency");
  }
});

test("every page references the favicon", () => {
  for (const f of ["index.html", "en.html", "de.html", "uk.html", "impressum.html", "datenschutz.html"]) {
    assert.match(read(f), /<link rel="icon" href="\/favicon\.ico"/, f + " favicon link");
  }
});

test("scanner is excluded from indexing", () => {
  assert.match(read("scanner.html"), /<meta name="robots" content="noindex, nofollow">/);
});

test("legal pages carry self-canonical and OG tags", () => {
  assert.match(read("impressum.html"), /<link rel="canonical" href="https:\/\/boodney\.band\/impressum\.html">/);
  assert.match(read("datenschutz.html"), /property="og:url" content="https:\/\/boodney\.band\/datenschutz\.html"/);
});

test("legal pages keep their URLs and load relocated css", () => {
  const imp = read("impressum.html");
  assert.match(imp, /Impressum/);
  assert.match(imp, /\/assets\/css\/legal\.css/);
  const ds = read("datenschutz.html");
  assert.match(ds, /Datenschutz/);
  assert.match(ds, /\/assets\/css\/legal\.css/);
});
