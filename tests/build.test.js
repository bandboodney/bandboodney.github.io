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
