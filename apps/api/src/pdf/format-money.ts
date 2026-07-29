import type { Currency } from '../common/currencies';

const LOCALE: Record<Currency, string> = { USD: 'en-US', IDR: 'id-ID' };

const FORMATTERS: Record<Currency, Intl.NumberFormat> = {
  USD: new Intl.NumberFormat(LOCALE.USD, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }),
  IDR: new Intl.NumberFormat(LOCALE.IDR, {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }),
};

/**
 * Deliberately duplicates apps/web/src/lib/ui.ts#money — the API can't import
 * from the web app, and this monorepo has no shared `packages/` workspace
 * yet. If one is ever added, this is the first thing to dedupe.
 */
export function formatMoney(amount: number, currency: Currency): string {
  return FORMATTERS[currency].format(amount);
}
