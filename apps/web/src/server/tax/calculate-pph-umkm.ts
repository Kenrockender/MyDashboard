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
//
// The tax year is the Indonesian calendar year: income counts in the year of
// its WIB date (see ../common/wib-date.ts), so a payment at 00:30 WIB on
// 1 January belongs to the new year even though UTC still says 31 December.
import { wibYear } from '../common/wib-date';

export const PPH_UMKM_EXEMPT_THRESHOLD_IDR = 500_000_000;
export const PPH_UMKM_RATE = 0.005;

/**
 * How a user's income is taxed, which decides whether the 0.5% final UMKM rate
 * applies at all:
 *  - `'business'`      — income from selling goods or non-professional
 *                        services. Qualifies for PPh Final UMKM (0.5%).
 *  - `'professional'`  — income from pekerjaan bebas (independent professional
 *                        services; since PP 20/2026 this names content
 *                        creators). Does NOT qualify for the 0.5% final rate —
 *                        it is taxed at progressive rates under PPh Pasal 17,
 *                        which this app does not compute.
 *
 * `undefined` means the user has not answered the question yet (every existing
 * user). We keep showing today's business-income figure, clearly labelled as
 * such, rather than guessing which regime they belong to — see the Reports UI.
 */
export type IncomeType = 'business' | 'professional';

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

/**
 * Estimates the PPh Final UMKM (0.5%) for the given year.
 *
 * Returns `null` when `incomeType` is `'professional'`: pekerjaan bebas income
 * does not qualify for the 0.5% final rate, so there is deliberately no figure
 * to show. `'business'` and the unanswered case (`undefined`) both return the
 * numeric estimate — identical to before this parameter existed — because the
 * only figure this app can compute is the business-income one; the Reports UI
 * labels the unanswered case accordingly and prompts the user to answer.
 */
export function calculatePphUmkmEstimate(
  income: IncomeRecord[],
  year: number,
  incomeType?: IncomeType,
): PphUmkmEstimate | null {
  if (incomeType === 'professional') return null;

  const grossRevenueIdr = income
    .filter((i) => (i.currency ?? 'USD') === 'IDR')
    .filter((i) => i.status === 'paid')
    .filter((i) => wibYear(i.date) === year)
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
