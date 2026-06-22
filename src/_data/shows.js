const fs = require("node:fs");
const path = require("node:path");

const LOCALES = { ru: "ru-RU", en: "en-US", de: "de-DE" };
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function localized(dateStr, opts) {
  const d = new Date(dateStr + "T00:00:00Z");
  const out = {};
  for (const [code, loc] of Object.entries(LOCALES)) {
    out[code] = new Intl.DateTimeFormat(loc, { ...opts, timeZone: "UTC" }).format(d);
  }
  return out;
}

module.exports = function () {
  const dir = path.join(__dirname, "events");
  const today = new Date().toISOString().slice(0, 10);

  const events = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      let raw;
      try {
        raw = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
      } catch (err) {
        throw new Error(`shows.js: failed to parse ${f}: ${err.message}`);
      }
      if (!ISO_DATE.test(raw.date || "")) {
        throw new Error(`shows.js: event in ${f} is missing a valid YYYY-MM-DD "date"`);
      }
      return {
        ...raw,
        status: raw.date < today ? "past" : "upcoming",
        year: Number(raw.date.slice(0, 4)),
        dayMonth: localized(raw.date, { day: "numeric", month: "long" }),
        monthYear: localized(raw.date, { month: "long", year: "numeric" }),
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const past = events
    .filter((e) => e.date < today)
    .sort((a, b) => b.date.localeCompare(a.date));
  const upcoming = events.filter((e) => e.date >= today)[0] || null;

  return { all: events, past, upcoming, lastPast: past[0] || null };
};
