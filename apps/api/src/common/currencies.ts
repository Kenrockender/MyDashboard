export const CURRENCIES = ['USD', 'IDR'] as const;
export type Currency = (typeof CURRENCIES)[number];
