import type { ProfitTotals } from '@/hooks/use-projects';
import { StatRow } from '@/components/ui/stat-group';
import { moneyRounded } from '@/lib/ui';

/** One StatRow per currency present — most projects have just one, so this renders as it always did. */
export function ProjectTotalsCard({ totals }: { totals: ProfitTotals[] }) {
  return (
    <div className="space-y-3">
      {totals.map((t) => (
        <div key={t.currency}>
          {totals.length > 1 && (
            <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
              {t.currency}
            </div>
          )}
          <StatRow
            stats={[
              { label: 'Income', value: moneyRounded(t.income, t.currency) },
              { label: 'Expenses', value: moneyRounded(t.expenses, t.currency), tone: 'negative' },
              { label: 'Profit', value: moneyRounded(t.profit, t.currency), tone: 'accent', ruled: true },
            ]}
          />
        </div>
      ))}
    </div>
  );
}
