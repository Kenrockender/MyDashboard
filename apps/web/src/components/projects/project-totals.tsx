import type { ProfitTotals } from '@/hooks/use-projects';
import { StatRow } from '@/components/ui/stat-group';
import { MeterRow } from '@/components/ui/meter-row';
import { money, moneyRounded, type Currency } from '@/lib/ui';

/** One StatRow per currency present — most projects have just one, so this renders as it always did. */
export function ProjectTotalsCard({
  totals,
  budget,
  budgetCurrency,
}: {
  totals: ProfitTotals[];
  budget?: number | null;
  budgetCurrency?: Currency | null;
}) {
  const budgetGroup = budgetCurrency ? totals.find((t) => t.currency === budgetCurrency) : undefined;
  const spent = budgetGroup?.expenses ?? 0;

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
      {!!budget && !!budgetCurrency && (
        <div className="rounded-[14px] border border-border bg-paper-raised p-4">
          <MeterRow
            label="Budget used"
            value={`${money(spent, budgetCurrency)} of ${money(budget, budgetCurrency)}`}
            share={spent / budget}
            tone={spent > budget ? 'negative' : 'accent'}
          />
        </div>
      )}
    </div>
  );
}
