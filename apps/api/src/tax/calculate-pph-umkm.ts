// Estimates Indonesia's PPh Final UMKM (0.5%) per PP 20/2026, continuing the
// scheme from PP 23/2018 / PP 55/2022: the first Rp500,000,000 of a tax
// year's gross revenue is exempt; only the excess is taxed at 0.5%. This
// applies to individual taxpayers (freelancers/sole proprietors), not
// corporate entities (PT/CV) — see 08-Future-Features.md's "Tax Calculation"
// entry and the research this feature was scoped from.
//
// IDR-denominated income only: this scheme is defined in Rupiah, and this
// codebase has no FX conversion anywhere (see calculate-profit.ts) — USD
// income is deliberately excluded rather than silently guessed-converted.
export const PPH_UMKM_EXEMPT_THRESHOLD_IDR = 500_000_000;
export const PPH_UMKM_RATE = 0.005;

export interface PphUmkmEstimate {
  year: number;
  grossRevenueIdr: number;
  exemptThresholdIdr: number;
  taxableAmountIdr: number;
  rate: number;
  estimatedTaxIdr: number;
}

interface IncomeRecord {
  amount: number | { toString(): string };
  currency?: string;
  status: string;
  date: Date | string;
}

export function calculatePphUmkmEstimate(
  income: IncomeRecord[],
  year: number,
): PphUmkmEstimate {
  const grossRevenueIdr = income
    .filter((i) => (i.currency ?? 'USD') === 'IDR')
    .filter((i) => i.status === 'paid')
    .filter((i) => new Date(i.date).getUTCFullYear() === year)
    .reduce((sum, i) => sum + Number(i.amount), 0);

  const taxableAmountIdr = Math.max(0, grossRevenueIdr - PPH_UMKM_EXEMPT_THRESHOLD_IDR);
  const estimatedTaxIdr = taxableAmountIdr * PPH_UMKM_RATE;

  return {
    year,
    grossRevenueIdr,
    exemptThresholdIdr: PPH_UMKM_EXEMPT_THRESHOLD_IDR,
    taxableAmountIdr,
    rate: PPH_UMKM_RATE,
    estimatedTaxIdr,
  };
}
