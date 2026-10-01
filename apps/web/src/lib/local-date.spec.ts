import { localDateIso, localMonthIso } from './local-date';

describe('local dates', () => {
  it("gives the user's own calendar day just after midnight on 1 January", () => {
    // Built from local-time parts, so this holds in any time zone the tests run in.
    expect(localDateIso(new Date(2027, 0, 1, 0, 30))).toBe('2027-01-01');
    expect(localDateIso(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31');
  });

  it('pads single-digit months and days', () => {
    expect(localDateIso(new Date(2026, 2, 9, 12, 0))).toBe('2026-03-09');
    expect(localMonthIso(new Date(2027, 0, 1, 0, 30))).toBe('2027-01');
  });
});
