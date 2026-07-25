import type { RecentActivityEntry } from '@/hooks/use-dashboard';
import { money } from '@/lib/ui';

const DATE = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

function formatDate(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso.slice(0, 10) : DATE.format(date);
}

export function RecentActivity({ items }: { items: RecentActivityEntry[] }) {
  if (items.length === 0)
    return <p className="px-5 py-4 text-sm text-ink-muted">No recent activity.</p>;

  return (
    <ul className="m-0 list-none p-0">
      {items.map((item, i) => {
        const income = item.type === 'income';
        return (
          <li
            key={i}
            className="flex items-center justify-between gap-3 border-t border-hair px-5 py-3"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`h-1.5 w-1.5 flex-none rounded-full ${
                    income ? 'bg-accent' : 'bg-negative'
                  }`}
                />
                <span className="truncate text-sm text-ink">
                  {income ? 'Income' : 'Expense'}
                </span>
              </div>
              <div className="mt-0.5 pl-3.5 text-xs text-ink-muted">
                {formatDate(item.date)}
              </div>
            </div>
            <span
              className={`whitespace-nowrap font-tabular font-mono text-sm ${
                income ? 'text-accent' : 'text-negative'
              }`}
            >
              {income ? '+' : '−'}
              {money(item.amount, item.currency)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
