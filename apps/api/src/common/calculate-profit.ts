import { Currency } from './currencies';

export interface ProfitTotals {
  currency: Currency;
  income: number;
  expenses: number;
  profit: number;
}

interface Amount {
  amount: number | { toString(): string };
  currency?: Currency;
}

/** Groups income/expenses by currency — amounts in different currencies are never summed together. */
export function calculateProfit(
  income: Amount[],
  expenses: Amount[],
): ProfitTotals[] {
  const totals = new Map<Currency, { income: number; expenses: number }>();

  const entry = (currency: Currency) => {
    const existing = totals.get(currency);
    if (existing) return existing;
    const created = { income: 0, expenses: 0 };
    totals.set(currency, created);
    return created;
  };

  for (const i of income) {
    entry(i.currency ?? 'USD').income += Number(i.amount);
  }
  for (const e of expenses) {
    entry(e.currency ?? 'USD').expenses += Number(e.amount);
  }

  return [...totals.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([currency, { income, expenses }]) => ({
      currency,
      income,
      expenses,
      profit: income - expenses,
    }));
}
