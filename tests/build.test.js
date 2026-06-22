const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const SITE = path.join(__dirname, "..", "_site");
const read = (p) => fs.readFileSync(path.join(SITE, p), "utf8");

test("homepage is generated", () => {
  assert.ok(fs.existsSync(path.join(SITE, "index.html")), "index.html missing");
  assert.match(read("index.html"), /build-ok/);
});

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

test("shows data derives localized dates", () => {
  const html = read("index.html");
  assert.match(html, /upcoming=2026-07-04/);
  assert.match(html, /dayMonth-de=4\. Juli/);
  assert.match(html, /lastPast-monthYear-en=January 2026/);
});
