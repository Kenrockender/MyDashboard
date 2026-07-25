const MONEY = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

const MONEY_ROUND = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

/** Line-item figures keep their cents. */
export function money(amount: number) {
  return MONEY.format(amount);
}

/** Headline figures on stat tiles drop the cents, as in the Refined elevation. */
export function moneyRounded(amount: number) {
  return MONEY_ROUND.format(amount);
}

export function percent(fraction: number, digits = 1) {
  return `${(fraction * 100).toFixed(digits)}%`;
}

const ACRONYMS = new Set(['api']);

/** Turns a snake_case category like "api_usage" into "API Usage". */
export function formatCategory(category: string) {
  return category
    .split('_')
    .filter(Boolean)
    .map((word) =>
      ACRONYMS.has(word.toLowerCase())
        ? word.toUpperCase()
        : word[0].toUpperCase() + word.slice(1),
    )
    .join(' ');
}

/** Mono, wide-tracked, uppercase — the ledger's field and column labels. */
export const microLabel =
  'font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted';

export const inputClass =
  'rounded-lg border border-border bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25';
