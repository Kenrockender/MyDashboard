import { Currency } from '../common/currencies';

export interface MonthlyTrendEntry {
  month: string;
  currency: Currency;
  revenue: number;
  expenses: number;
  profit: number;
}

interface DatedAmount {
  amount: number | { toString(): string };
  currency?: Currency;
  date: Date | string;
}

export function monthKey(date: Date | string): string {
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function bucketKey(month: string, currency: Currency): string {
  return `${month}:${currency}`;
}

export function calculateMonthlyTrend(
  income: DatedAmount[],
  expenses: DatedAmount[],
): MonthlyTrendEntry[] {
  const buckets = new Map<
    string,
    { month: string; currency: Currency; revenue: number; expenses: number }
  >();

  const entry = (month: string, currency: Currency) => {
    const key = bucketKey(month, currency);
    const existing = buckets.get(key);
    if (existing) return existing;
    const created = { month, currency, revenue: 0, expenses: 0 };
    buckets.set(key, created);
    return created;
  };

  for (const i of income) {
    entry(monthKey(i.date), i.currency ?? 'USD').revenue += Number(i.amount);
  }

  for (const e of expenses) {
    entry(monthKey(e.date), e.currency ?? 'USD').expenses += Number(e.amount);
  }

  return [...buckets.values()]
    .sort(
      (a, b) =>
        a.month.localeCompare(b.month) || a.currency.localeCompare(b.currency),
    )
    .map(({ month, currency, revenue, expenses }) => ({
      month,
      currency,
      revenue,
      expenses,
      profit: revenue - expenses,
    }));
}
