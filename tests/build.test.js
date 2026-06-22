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
});

test("scanner is not double-emitted as a template", () => {
  assert.strictEqual(
    fs.existsSync(path.join(SITE, "tools/scanner/index.html")),
    false,
    "scanner should only exist at /scanner.html, not /tools/scanner/"
  );
});

test("three language pages are generated at preserved URLs", () => {
  for (const f of ["index.html", "en.html", "de.html"]) {
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

test("legal pages keep their URLs and load relocated css", () => {
  const imp = read("impressum.html");
  assert.match(imp, /Impressum/);
  assert.match(imp, /\/assets\/css\/legal\.css/);
  const ds = read("datenschutz.html");
  assert.match(ds, /Datenschutz/);
  assert.match(ds, /\/assets\/css\/legal\.css/);
});
