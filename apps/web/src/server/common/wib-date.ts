// Calendar dates in Indonesia (WIB, UTC+7 all year: Indonesia has no daylight
// saving). A tax year, a report month and an invoice's year are Indonesian
// calendar dates, but the server runs in UTC, so reading a timestamp with
// getUTCFullYear() files anything recorded between 00:00 and 06:59 WIB on
// 1 January under the previous year (and the 1st of any month under the
// previous month).
//
// Both kinds of stored date come out right here:
//  - days the forms save as `YYYY-MM-DD` are stored as UTC midnight, which is
//    07:00 WIB on the same day, so they keep their day;
//  - real moments such as `Timestamp.now()` get the WIB day they happened on.
export const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

function shiftToWib(date: Date | string): Date {
  return new Date(new Date(date).getTime() + WIB_OFFSET_MS);
}

/** Calendar year in WIB. */
export function wibYear(date: Date | string): number {
  return shiftToWib(date).getUTCFullYear();
}

/** `YYYY-MM` in WIB. */
export function wibMonthKey(date: Date | string): string {
  const d = shiftToWib(date);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** `YYYY-MM-DD` in WIB. */
export function wibDateKey(date: Date | string): string {
  return shiftToWib(date).toISOString().slice(0, 10);
}
