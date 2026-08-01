export const CURRENCIES = ['USD', 'IDR'] as const;
export type Currency = (typeof CURRENCIES)[number];

/** IDR is conventionally shown without decimals; USD keeps cents. */
const LOCALE: Record<Currency, string> = { USD: 'en-US', IDR: 'id-ID' };

const MONEY: Record<Currency, Intl.NumberFormat> = {
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

const MONEY_ROUND: Record<Currency, Intl.NumberFormat> = {
  USD: new Intl.NumberFormat(LOCALE.USD, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }),
  IDR: MONEY.IDR,
};

const MONEY_COMPACT: Record<Currency, Intl.NumberFormat> = {
  USD: new Intl.NumberFormat(LOCALE.USD, {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }),
  IDR: new Intl.NumberFormat(LOCALE.IDR, {
    style: 'currency',
    currency: 'IDR',
    notation: 'compact',
    maximumFractionDigits: 1,
  }),
};

/** Line-item figures keep their cents (except IDR, which has none). */
export function money(amount: number, currency: Currency = 'USD') {
  return MONEY[currency].format(amount);
}

/** Headline figures on stat tiles drop the cents, as in the Refined elevation. */
export function moneyRounded(amount: number, currency: Currency = 'USD') {
  return MONEY_ROUND[currency].format(amount);
}

/**
 * Abbreviated form ("Rp 154 jt", "$13.8K") for places too narrow to fit the
 * full figure — chart axes, and headline tiles on small screens, where an IDR
 * total would otherwise overflow its cell.
 */
export function moneyCompact(amount: number, currency: Currency = 'USD') {
  return MONEY_COMPACT[currency].format(amount);
}

/**
 * Groups a list by currency, preserving each currency's first-seen order.
 * Report/dashboard sections use this to render one block per currency in use
 * — a single block when everything is one currency, more only when mixed.
 */
export function groupByCurrency<T>(
  items: T[],
  getCurrency: (item: T) => Currency,
): { currency: Currency; items: T[] }[] {
  const groups = new Map<Currency, T[]>();
  for (const item of items) {
    const currency = getCurrency(item);
    const list = groups.get(currency);
    if (list) list.push(item);
    else groups.set(currency, [item]);
  }
  return [...groups.entries()].map(([currency, items]) => ({ currency, items }));
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

/** Decodes a base64 string (as stored on an Attachment) back into a Blob for download/preview. */
export function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteChars = atob(base64);
  const bytes = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
  return new Blob([bytes], { type: mimeType });
}

/** Triggers a browser download for an already-fetched Blob (e.g. a PDF from apiClient.getBlob). */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const inputClass =
  'w-full min-w-0 rounded-lg border border-border bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25';
