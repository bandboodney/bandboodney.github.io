const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { scaffoldEvent } = require("../scripts/new-event.js");

// Each test gets an isolated events dir seeded with a past event to copy from.
function makeEventsDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "events-"));
  fs.writeFileSync(
    path.join(dir, "2026-07-04.json"),
    JSON.stringify({
      date: "2026-07-04",
      venue: { name: "Kulturzentrum Gorod - GIK e.V.", city: "München", country: "DE" },
      doorsOpen: "19:00",
      startTime: "19:30",
      price: "20",
      poster: "poster-2026-07-04.jpg",
      repertoire: ["Nirvana", "Кино"],
      setlist: { parts: [] },
    })
  );
  return dir;
}

test("scaffolds a future event prefilled from the latest one", () => {
  const eventsDir = makeEventsDir();
  const { target, copiedFrom, event } = scaffoldEvent("2026-09-12", { eventsDir, today: "2026-07-07" });

  assert.strictEqual(copiedFrom, "2026-07-04.json");
  assert.ok(fs.existsSync(target), "file written");
  const onDisk = JSON.parse(fs.readFileSync(target, "utf8"));
  assert.deepStrictEqual(onDisk, event, "returned event matches file");
  assert.strictEqual(onDisk.date, "2026-09-12");
  assert.strictEqual(onDisk.poster, "poster-2026-09-12.jpg", "poster name derived from date");
  assert.strictEqual(onDisk.venue.name, "Kulturzentrum Gorod - GIK e.V.", "venue copied");
  assert.deepStrictEqual(onDisk.repertoire, ["Nirvana", "Кино"], "repertoire copied");
  assert.strictEqual(onDisk.setlist, undefined, "setlist NOT copied — stays a surprise");
});

test("rejects malformed, impossible, and past dates", () => {
  const eventsDir = makeEventsDir();
  const opts = { eventsDir, today: "2026-07-07" };
  assert.throws(() => scaffoldEvent("12.09.2026", opts), /YYYY-MM-DD/);
  assert.throws(() => scaffoldEvent(undefined, opts), /YYYY-MM-DD/);
  assert.throws(() => scaffoldEvent("2026-02-31", opts), /not a valid calendar date/);
  assert.throws(() => scaffoldEvent("2026-07-01", opts), /in the past/);
});

test("refuses to overwrite an existing event file", () => {
  const eventsDir = makeEventsDir();
  const opts = { eventsDir, today: "2026-07-01" };
  assert.throws(() => scaffoldEvent("2026-07-04", opts), /already exists/);
});

test("today counts as upcoming (gig day rebuilds keep the announcement)", () => {
  const eventsDir = makeEventsDir();
  const { event } = scaffoldEvent("2026-08-01", { eventsDir, today: "2026-08-01" });
  assert.strictEqual(event.date, "2026-08-01");
});
