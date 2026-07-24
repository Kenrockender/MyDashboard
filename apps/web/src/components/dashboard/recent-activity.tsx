import type { RecentActivityEntry } from '@/hooks/use-dashboard';
import { Badge } from '@/components/ui/badge';

export function RecentActivity({ items }: { items: RecentActivityEntry[] }) {
  if (items.length === 0) return <p className="text-sm text-ink-muted">No recent activity.</p>;

  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-paper-raised">
      {items.map((item, i) => (
        <li key={i} className="flex items-center justify-between gap-4 px-4 py-3">
          <Badge tone={item.type === 'income' ? 'positive' : 'negative'}>{item.type}</Badge>
          <span className="font-tabular font-mono text-sm text-ink">
            {item.type === 'income' ? '+' : '−'}${item.amount.toFixed(2)}
          </span>
          <span className="text-sm text-ink-muted">{item.date.slice(0, 10)}</span>
        </li>
      ))}
    </ul>
  );
}
