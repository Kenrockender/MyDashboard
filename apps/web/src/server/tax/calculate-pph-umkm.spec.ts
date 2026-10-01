import { calculatePphUmkmEstimate } from './calculate-pph-umkm';

describe('calculatePphUmkmEstimate', () => {
  it('owes nothing when annual IDR revenue is under the Rp500jt exemption', () => {
    const income = [
      { amount: 300_000_000, currency: 'IDR', status: 'paid', date: '2026-03-01' },
      { amount: 150_000_000, currency: 'IDR', status: 'paid', date: '2026-06-01' },
    ];
    const result = calculatePphUmkmEstimate(income, 2026)!;
    expect(result.grossRevenueIdr).toBe(450_000_000);
    expect(result.taxableAmountIdr).toBe(0);
    expect(result.estimatedTaxIdr).toBe(0);
  });

  it('taxes only the excess over Rp500jt, matching the documented example (Rp560jt -> Rp300rb)', () => {
    const income = [{ amount: 560_000_000, currency: 'IDR', status: 'paid', date: '2026-05-01' }];
    const result = calculatePphUmkmEstimate(income, 2026)!;
    expect(result.taxableAmountIdr).toBe(60_000_000);
    expect(result.estimatedTaxIdr).toBe(300_000);
  });

  it('excludes USD income entirely (no FX conversion in this app)', () => {
    const income = [
      { amount: 600_000_000, currency: 'IDR', status: 'paid', date: '2026-01-01' },
      { amount: 999_999, currency: 'USD', status: 'paid', date: '2026-01-01' },
    ];
    const result = calculatePphUmkmEstimate(income, 2026)!;
    expect(result.grossRevenueIdr).toBe(600_000_000);
  });

  it('excludes income not yet marked paid', () => {
    const income = [
      { amount: 600_000_000, currency: 'IDR', status: 'pending', date: '2026-01-01' },
    ];
    const result = calculatePphUmkmEstimate(income, 2026)!;
    expect(result.grossRevenueIdr).toBe(0);
  });

  it('only counts income within the requested tax year, using the WIB calendar', () => {
    const income = [
      // 23:59:59 WIB on 31 Dec 2025: last moment of the 2025 tax year
      { amount: 600_000_000, currency: 'IDR', status: 'paid', date: '2025-12-31T16:59:59.000Z' },
      // 00:00 WIB on 1 Jan 2026: first moment of the 2026 tax year
      { amount: 600_000_000, currency: 'IDR', status: 'paid', date: '2025-12-31T17:00:00.000Z' },
    ];
    expect(calculatePphUmkmEstimate(income, 2026)!.grossRevenueIdr).toBe(600_000_000);
    expect(calculatePphUmkmEstimate(income, 2025)!.grossRevenueIdr).toBe(600_000_000);
  });

  it('counts a payment made at 00:30 WIB on 1 January in the new year, though UTC still says 31 December', () => {
    const income = [
      { amount: 560_000_000, currency: 'IDR', status: 'paid', date: '2025-12-31T17:30:00.000Z' },
    ];
    expect(calculatePphUmkmEstimate(income, 2026)!.grossRevenueIdr).toBe(560_000_000);
    expect(calculatePphUmkmEstimate(income, 2025)!.grossRevenueIdr).toBe(0);
  });

  it('keeps form-entered dates (YYYY-MM-DD) in their own year on both sides of the boundary', () => {
    const income = [
      { amount: 100_000_000, currency: 'IDR', status: 'paid', date: '2025-12-31' },
      { amount: 200_000_000, currency: 'IDR', status: 'paid', date: '2026-01-01' },
    ];
    expect(calculatePphUmkmEstimate(income, 2025)!.grossRevenueIdr).toBe(100_000_000);
    expect(calculatePphUmkmEstimate(income, 2026)!.grossRevenueIdr).toBe(200_000_000);
  });

  describe('income type selection (PP 20/2026: pekerjaan bebas is excluded)', () => {
    const income = [{ amount: 560_000_000, currency: 'IDR', status: 'paid', date: '2026-05-01' }];

    it("business income gives the identical result to the no-argument default", () => {
      const business = calculatePphUmkmEstimate(income, 2026, 'business');
      const legacy = calculatePphUmkmEstimate(income, 2026);
      // Same object shape and same numbers as before the incomeType param existed.
      expect(business).toEqual(legacy);
      expect(business).not.toBeNull();
      expect(business!.taxableAmountIdr).toBe(60_000_000);
      expect(business!.estimatedTaxIdr).toBe(300_000);
    });

    it('professional services (pekerjaan bebas) gives no UMKM figure at all', () => {
      // Content creators and other independent professionals are taxed under
      // PPh Pasal 17, not the 0.5% final rate — so there is deliberately no
      // estimate to show.
      expect(calculatePphUmkmEstimate(income, 2026, 'professional')).toBeNull();
    });

    it('an unanswered income type gives the estimate (labelled business-only in the UI)', () => {
      const unanswered = calculatePphUmkmEstimate(income, 2026, undefined);
      expect(unanswered).not.toBeNull();
      expect(unanswered!.estimatedTaxIdr).toBe(300_000);
    });
  });
});
