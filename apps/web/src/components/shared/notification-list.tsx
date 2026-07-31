'use client';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { money } from '@/lib/ui';
import type { OverdueIncomeEntry, UpcomingRecurringExpenseEntry } from '@/hooks/use-notifications';

export function NotificationList({
  overdueIncome,
  upcomingRecurringExpenses,
  onNavigate,
}: {
  overdueIncome: OverdueIncomeEntry[];
  upcomingRecurringExpenses: UpcomingRecurringExpenseEntry[];
  onNavigate?: () => void;
}) {
  return (
    <div>
      <section>
        <div className="border-b border-hair px-4 py-3">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
            Overdue income
          </h3>
        </div>
        {overdueIncome.length === 0 ? (
          <p className="px-4 py-4 text-center text-sm text-ink-muted">
            Nothing overdue — you&apos;re caught up.
          </p>
        ) : (
          <ul className="m-0 max-h-56 list-none overflow-y-auto p-0">
            {overdueIncome.map((entry) => (
              <li key={entry.id} className="border-t border-hair px-4 py-3 first:border-t-0">
                <Link
                  href={`/projects/${entry.projectId}`}
                  onClick={onNavigate}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm text-ink">{entry.projectName}</div>
                    <div className="mt-0.5 text-xs text-ink-muted">{entry.date.slice(0, 10)}</div>
                  </div>
                  <div className="flex flex-none items-center gap-2">
                    <span className="font-tabular font-mono text-sm text-ink">
                      {money(entry.amount, entry.currency)}
                    </span>
                    <Badge>{entry.kind === 'overdue' ? 'overdue' : 'pending'}</Badge>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="border-t border-b border-hair px-4 py-3">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
            Upcoming recurring expenses
          </h3>
        </div>
        {upcomingRecurringExpenses.length === 0 ? (
          <p className="px-4 py-4 text-center text-sm text-ink-muted">
            Nothing due in the next two weeks.
          </p>
        ) : (
          <ul className="m-0 max-h-56 list-none overflow-y-auto p-0">
            {upcomingRecurringExpenses.map((entry) => (
              <li key={entry.id} className="border-t border-hair px-4 py-3 first:border-t-0">
                <Link
                  href={`/projects/${entry.projectId}`}
                  onClick={onNavigate}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm text-ink">{entry.description}</div>
                    <div className="mt-0.5 text-xs text-ink-muted">
                      {entry.projectName} · due {entry.nextDueDate.slice(0, 10)}
                    </div>
                  </div>
                  <div className="flex flex-none items-center gap-2">
                    <span className="font-tabular font-mono text-sm text-ink">
                      {money(entry.amount, entry.currency)}
                    </span>
                    <Badge tone="neutral">{entry.interval}</Badge>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
