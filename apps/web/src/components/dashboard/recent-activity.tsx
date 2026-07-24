import type { RecentActivityEntry } from '@/hooks/use-dashboard';

export function RecentActivity({ items }: { items: RecentActivityEntry[] }) {
  if (items.length === 0) return <p className="text-sm text-gray-500">No recent activity.</p>;

  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i} className="border rounded p-2 flex items-center justify-between">
          <span className="capitalize">{item.type}</span>
          <span>${item.amount.toFixed(2)}</span>
          <span className="text-sm text-gray-500">{item.date.slice(0, 10)}</span>
        </li>
      ))}
    </ul>
  );
}
