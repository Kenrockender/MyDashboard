// Dates in the user's own time zone, in the format `<input type="date">` and
// the month picker use. `new Date().toISOString().slice(0, 10)` gives the UTC
// date instead, which in Indonesia is still yesterday until 07:00 WIB
// (08:00 WITA, 09:00 WIT), so a payment recorded just after midnight on
// 1 January would default to 31 December and land in the previous tax year.
const pad = (n: number) => String(n).padStart(2, '0');

/** `YYYY-MM-DD` in the browser's time zone (today by default). */
export function localDateIso(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** `YYYY-MM` in the browser's time zone (this month by default). */
export function localMonthIso(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}
