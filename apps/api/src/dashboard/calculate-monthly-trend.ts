export interface MonthlyTrendEntry {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

interface DatedAmount {
  amount: number | { toString(): string };
  date: Date | string;
}

function monthKey(date: Date | string): string {
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function calculateMonthlyTrend(income: DatedAmount[], expenses: DatedAmount[]): MonthlyTrendEntry[] {
  const months = new Map<string, { revenue: number; expenses: number }>();

  for (const i of income) {
    const key = monthKey(i.date);
    const entry = months.get(key) ?? { revenue: 0, expenses: 0 };
    entry.revenue += Number(i.amount);
    months.set(key, entry);
  }

  for (const e of expenses) {
    const key = monthKey(e.date);
    const entry = months.get(key) ?? { revenue: 0, expenses: 0 };
    entry.expenses += Number(e.amount);
    months.set(key, entry);
  }

  return [...months.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { revenue, expenses }]) => ({ month, revenue, expenses, profit: revenue - expenses }));
}
