import { wibDateKey, wibMonthKey, wibYear } from './wib-date';

describe('WIB calendar dates', () => {
  it('puts 00:00 WIB on 1 January in the new year, and 23:59 WIB on 31 December in the old one', () => {
    expect(wibYear('2025-12-31T16:59:59.999Z')).toBe(2025); // 23:59:59 WIB, 31 Dec
    expect(wibYear('2025-12-31T17:00:00.000Z')).toBe(2026); // 00:00 WIB, 1 Jan
    expect(wibYear('2025-12-31T23:59:59.000Z')).toBe(2026); // 06:59:59 WIB, 1 Jan (UTC still says 2025)
  });

  it('keeps the day of dates the forms save as YYYY-MM-DD (stored as UTC midnight)', () => {
    expect(wibYear('2026-01-01')).toBe(2026);
    expect(wibYear('2025-12-31')).toBe(2025);
    expect(wibDateKey('2026-01-01')).toBe('2026-01-01');
    expect(wibMonthKey(new Date('2026-03-01'))).toBe('2026-03');
  });

  it('moves a moment early on the 1st into the new month and day', () => {
    expect(wibMonthKey('2026-01-31T17:30:00.000Z')).toBe('2026-02'); // 00:30 WIB, 1 Feb
    expect(wibMonthKey('2026-01-31T16:59:00.000Z')).toBe('2026-01'); // 23:59 WIB, 31 Jan
    expect(wibDateKey('2026-03-09T18:30:00.000Z')).toBe('2026-03-10'); // 01:30 WIB, 10 Mar
  });
});
