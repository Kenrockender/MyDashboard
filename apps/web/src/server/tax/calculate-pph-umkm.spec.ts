import { calculatePphUmkmEstimate } from './calculate-pph-umkm';

describe('calculatePphUmkmEstimate', () => {
  it('owes nothing when annual IDR revenue is under the Rp500jt exemption', () => {
    const income = [
      { amount: 300_000_000, currency: 'IDR', status: 'paid', date: '2026-03-01' },
      { amount: 150_000_000, currency: 'IDR', status: 'paid', date: '2026-06-01' },
    ];
    const result = calculatePphUmkmEstimate(income, 2026);
    expect(result.grossRevenueIdr).toBe(450_000_000);
    expect(result.taxableAmountIdr).toBe(0);
    expect(result.estimatedTaxIdr).toBe(0);
  });

  it('taxes only the excess over Rp500jt, matching the documented example (Rp560jt -> Rp300rb)', () => {
    const income = [{ amount: 560_000_000, currency: 'IDR', status: 'paid', date: '2026-05-01' }];
    const result = calculatePphUmkmEstimate(income, 2026);
    expect(result.taxableAmountIdr).toBe(60_000_000);
    expect(result.estimatedTaxIdr).toBe(300_000);
  });

  it('excludes USD income entirely (no FX conversion in this app)', () => {
    const income = [
      { amount: 600_000_000, currency: 'IDR', status: 'paid', date: '2026-01-01' },
      { amount: 999_999, currency: 'USD', status: 'paid', date: '2026-01-01' },
    ];
    const result = calculatePphUmkmEstimate(income, 2026);
    expect(result.grossRevenueIdr).toBe(600_000_000);
  });

  it('excludes income not yet marked paid', () => {
    const income = [
      { amount: 600_000_000, currency: 'IDR', status: 'pending', date: '2026-01-01' },
    ];
    const result = calculatePphUmkmEstimate(income, 2026);
    expect(result.grossRevenueIdr).toBe(0);
  });

  it('only counts income within the requested tax year', () => {
    const income = [
      { amount: 600_000_000, currency: 'IDR', status: 'paid', date: '2025-12-31T23:59:59.000Z' },
      { amount: 600_000_000, currency: 'IDR', status: 'paid', date: '2026-01-01T00:00:00.000Z' },
    ];
    const result = calculatePphUmkmEstimate(income, 2026);
    expect(result.grossRevenueIdr).toBe(600_000_000);
  });
});
