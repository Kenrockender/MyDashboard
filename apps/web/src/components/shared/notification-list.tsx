'use client';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { money } from '@/lib/ui';
import type { OverdueIncomeEntry } from '@/hooks/use-notifications';

export function NotificationList({
  entries,
  onNavigate,
}: {
  entries: OverdueIncomeEntry[];
  onNavigate?: () => void;
}) {
  return (
    <div>
      <div className="border-b border-hair px-4 py-3">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
          Overdue income
        </h3>
      </div>
      {entries.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-ink-muted">
          Nothing overdue — you&apos;re caught up.
        </p>
      ) : (
        <ul className="m-0 max-h-80 list-none overflow-y-auto p-0">
          {entries.map((entry) => (
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
    </div>
  );
}
