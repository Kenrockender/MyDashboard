import type { ProjectTotals } from '@/hooks/use-projects';
import { StatRow } from '@/components/ui/stat-group';
import { moneyRounded } from '@/lib/ui';

export function ProjectTotalsCard({ totals }: { totals: ProjectTotals }) {
  return (
    <StatRow
      stats={[
        { label: 'Income', value: moneyRounded(totals.income) },
        { label: 'Expenses', value: moneyRounded(totals.expenses), tone: 'negative' },
        { label: 'Profit', value: moneyRounded(totals.profit), tone: 'accent', ruled: true },
      ]}
    />
  );
}
