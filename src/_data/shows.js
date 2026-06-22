const fs = require("node:fs");
const path = require("node:path");

const LOCALES = { ru: "ru-RU", en: "en-US", de: "de-DE" };

function localized(dateStr, opts) {
  const d = new Date(dateStr + "T00:00:00");
  const out = {};
  for (const [code, loc] of Object.entries(LOCALES)) {
    out[code] = new Intl.DateTimeFormat(loc, opts).format(d);
  }
  return out;
}

module.exports = function () {
  const dir = path.join(__dirname, "events");
  const events = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")))
    .map((e) => ({
      ...e,
      year: Number(e.date.slice(0, 4)),
      dayMonth: localized(e.date, { day: "numeric", month: "long" }),
      monthYear: localized(e.date, { month: "long", year: "numeric" }),
    }));

  const today = new Date().toISOString().slice(0, 10);
  const past = events
    .filter((e) => e.date < today)
    .sort((a, b) => b.date.localeCompare(a.date));
  const upcoming =
    events
      .filter((e) => e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))[0] || null;

  return { all: events, past, upcoming, lastPast: past[0] || null };
};
