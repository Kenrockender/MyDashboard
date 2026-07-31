import { Currency } from '../common/currencies';
import type { RecurrenceInterval } from '../expenses/dto/create-expense.dto';

export interface UpcomingRecurringExpenseEntry {
  id: string;
  projectId: string;
  projectName: string;
  description: string;
  amount: number;
  currency: Currency;
  category: string;
  interval: RecurrenceInterval;
  nextDueDate: Date;
}

interface ExpenseRecord {
  id: string;
  projectId: string;
  amount: number | { toString(): string };
  currency?: Currency;
  description?: string;
  category: string;
  date: Date | string;
  isRecurring?: boolean;
  recurrenceInterval?: RecurrenceInterval | null;
}

const DEFAULT_LOOKAHEAD_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

function advance(date: Date, interval: RecurrenceInterval): Date {
  const next = new Date(date);
  if (interval === 'weekly') next.setDate(next.getDate() + 7);
  else if (interval === 'monthly') next.setMonth(next.getMonth() + 1);
  else next.setFullYear(next.getFullYear() + 1);
  return next;
}

/**
 * Advances a recurring expense's last logged date forward by its interval
 * until the next occurrence lands on or after `now` — so an expense logged
 * months ago still points at the correct upcoming date instead of one that's
 * long since passed. Nothing auto-creates a new expense record here; this
 * only computes when the next one is expected, for a reminder.
 */
function nextOccurrence(date: Date, interval: RecurrenceInterval, now: Date): Date {
  let next = advance(date, interval);
  while (next.getTime() < now.getTime()) {
    next = advance(next, interval);
  }
  return next;
}

/** Sorted soonest-first — mirrors calculateOverdueIncome's oldest-first urgency ordering. */
export function calculateUpcomingRecurringExpenses(
  expenses: ExpenseRecord[],
  projectNames: Map<string, string>,
  now: Date = new Date(),
  lookaheadDays: number = DEFAULT_LOOKAHEAD_DAYS,
): UpcomingRecurringExpenseEntry[] {
  const horizon = new Date(now.getTime() + lookaheadDays * DAY_MS);
  const entries: UpcomingRecurringExpenseEntry[] = [];

  for (const e of expenses) {
    if (!e.isRecurring || !e.recurrenceInterval) continue;

    const nextDueDate = nextOccurrence(new Date(e.date), e.recurrenceInterval, now);
    if (nextDueDate.getTime() > horizon.getTime()) continue;

    entries.push({
      id: e.id,
      projectId: e.projectId,
      projectName: projectNames.get(e.projectId) ?? 'Unknown project',
      description: e.description || 'Expense',
      amount: Number(e.amount),
      currency: e.currency ?? 'USD',
      category: e.category,
      interval: e.recurrenceInterval,
      nextDueDate,
    });
  }

  return entries.sort((a, b) => a.nextDueDate.getTime() - b.nextDueDate.getTime());
}
