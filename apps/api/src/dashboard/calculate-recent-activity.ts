import { Currency } from '../common/currencies';

export interface RecentActivityEntry {
  type: 'income' | 'expense';
  projectId: string;
  amount: number;
  currency: Currency;
  date: Date | string;
}

interface DatedRecord {
  projectId: string;
  amount: number | { toString(): string };
  currency?: Currency;
  date: Date | string;
}

export function calculateRecentActivity(
  income: DatedRecord[],
  expenses: DatedRecord[],
  limit = 10,
): RecentActivityEntry[] {
  const entries: RecentActivityEntry[] = [
    ...income.map((i) => ({
      type: 'income' as const,
      projectId: i.projectId,
      amount: Number(i.amount),
      currency: i.currency ?? ('USD' as const),
      date: i.date,
    })),
    ...expenses.map((e) => ({
      type: 'expense' as const,
      projectId: e.projectId,
      amount: Number(e.amount),
      currency: e.currency ?? ('USD' as const),
      date: e.date,
    })),
  ];

  return entries
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}
