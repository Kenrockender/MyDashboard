import { Currency } from '../common/currencies';

export interface OverdueIncomeEntry {
  id: string;
  projectId: string;
  projectName: string;
  amount: number;
  currency: Currency;
  date: Date | string;
  /** `overdue` = explicitly flagged; `pending_past_due` = still `pending`,
   *  but its date has already passed — nothing auto-flips `status` today, so
   *  this catches income that's overdue in fact but not yet in name. */
  kind: 'overdue' | 'pending_past_due';
}

interface IncomeRecord {
  id: string;
  projectId: string;
  amount: number | { toString(): string };
  currency?: Currency;
  status: string;
  date: Date | string;
}

/** Sorted oldest-first — the opposite of calculateRecentActivity's
 *  newest-first, since urgency here means "longest overdue", not "latest". */
export function calculateOverdueIncome(
  income: IncomeRecord[],
  projectNames: Map<string, string>,
  now: Date = new Date(),
): OverdueIncomeEntry[] {
  const entries: OverdueIncomeEntry[] = [];

  for (const i of income) {
    const isOverdueStatus = i.status === 'overdue';
    const isPendingPastDue =
      i.status === 'pending' && new Date(i.date).getTime() < now.getTime();
    if (!isOverdueStatus && !isPendingPastDue) continue;

    entries.push({
      id: i.id,
      projectId: i.projectId,
      projectName: projectNames.get(i.projectId) ?? 'Unknown project',
      amount: Number(i.amount),
      currency: i.currency ?? 'USD',
      date: i.date,
      kind: isOverdueStatus ? 'overdue' : 'pending_past_due',
    });
  }

  return entries.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
}

/** Groups overdue amounts by currency — never summed together, following the
 *  same rule as calculateProfit (this codebase has no FX conversion). */
export function totalsByCurrency(
  entries: OverdueIncomeEntry[],
): { currency: Currency; total: number }[] {
  const totals = new Map<Currency, number>();
  for (const e of entries) {
    totals.set(e.currency, (totals.get(e.currency) ?? 0) + e.amount);
  }
  return [...totals.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([currency, total]) => ({ currency, total }));
}
