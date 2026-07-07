#!/usr/bin/env node
// Scaffold the next concert: creates src/_data/events/YYYY-MM-DD.json
// prefilled from the most recent existing event (venue, times, price,
// repertoire). Usage:
//
//   npm run new-event -- 2026-09-12
//
// The site flips back to announcement mode on the next build once an event
// with a future date exists. Deliberately omits `setlist` (added after the
// gig) — see README "Add or update a concert".

const fs = require("node:fs");
const path = require("node:path");

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_DIR = path.join(__dirname, "..", "src", "_data", "events");

function scaffoldEvent(dateStr, { eventsDir = DEFAULT_DIR, today } = {}) {
  today = today || new Date().toISOString().slice(0, 10);

  if (!ISO_DATE.test(dateStr || "")) {
    throw new Error(`expected a YYYY-MM-DD date, got "${dateStr}"`);
  }
  // reject impossible calendar dates (e.g. 2026-02-31)
  const roundTrip = new Date(dateStr + "T00:00:00Z").toISOString().slice(0, 10);
  if (roundTrip !== dateStr) {
    throw new Error(`"${dateStr}" is not a valid calendar date`);
  }
  if (dateStr < today) {
    throw new Error(`"${dateStr}" is in the past — the site would stay in between-gigs mode`);
  }

  const target = path.join(eventsDir, `${dateStr}.json`);
  if (fs.existsSync(target)) {
    throw new Error(`${path.relative(process.cwd(), target)} already exists`);
  }

  // Prefill from the most recent existing event so venue/price/times only
  // need editing when they actually change.
  const latest = fs
    .readdirSync(eventsDir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .pop();
  const base = latest ? JSON.parse(fs.readFileSync(path.join(eventsDir, latest), "utf8")) : {};

  const event = {
    date: dateStr,
    venue: base.venue || {
      name: "",
      address: "",
      street: "",
      postalCode: "",
      city: "München",
      country: "DE",
    },
    doorsOpen: base.doorsOpen || "19:00",
    startTime: base.startTime || "19:30",
    price: base.price || "20",
    poster: `poster-${dateStr}.jpg`,
    repertoire: base.repertoire || [],
    // no `setlist` — it stays a surprise until after the gig
  };

  fs.writeFileSync(target, JSON.stringify(event, null, 2) + "\n");
  return { target, copiedFrom: latest || null, event };
}

module.exports = { scaffoldEvent };

if (require.main === module) {
  try {
    const { target, copiedFrom } = scaffoldEvent(process.argv[2]);
    const rel = path.relative(process.cwd(), target);
    console.log(`Created ${rel}${copiedFrom ? ` (prefilled from ${copiedFrom})` : ""}`);
    console.log("\nNext steps:");
    console.log(`  1. Add the poster image: src/assets/img/poster-${process.argv[2]}.jpg`);
    console.log(`  2. Review venue / times / price / repertoire in ${rel}`);
    console.log("  3. npm test   # build + verify, then commit and open a PR");
  } catch (err) {
    console.error(`new-event: ${err.message}`);
    console.error("Usage: npm run new-event -- YYYY-MM-DD");
    process.exit(1);
  }
}
