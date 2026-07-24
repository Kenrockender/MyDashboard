import type { ProjectTotals } from '@/hooks/use-projects';
import { KpiCard } from '@/components/dashboard/kpi-card';

export function ProjectTotalsCard({ totals }: { totals: ProjectTotals }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <KpiCard label="Income" value={`$${totals.income.toFixed(2)}`} tone="accent" />
      <KpiCard label="Expenses" value={`$${totals.expenses.toFixed(2)}`} tone="negative" />
      <KpiCard label="Profit" value={`$${totals.profit.toFixed(2)}`} tone="accent" />
    </div>
  );
}
