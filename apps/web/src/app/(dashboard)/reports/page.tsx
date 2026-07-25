'use client';
import { useState } from 'react';
import {
  useMonthlyReport,
  useProfitabilityReport,
  useExpenseReport,
  useRevenueReport,
} from '@/hooks/use-reports';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { SectionHeading } from '@/components/ui/section-heading';
import { StatRow } from '@/components/ui/stat-group';
import { MeterRow } from '@/components/ui/meter-row';
import { Skeleton, ListSkeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { formatCategory, inputClass, money, moneyRounded, percent, type Currency } from '@/lib/ui';

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function monthLabel(month: string) {
  const date = new Date(`${month}-01T00:00:00`);
  return Number.isNaN(date.getTime())
    ? month
    : new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
}

const COLUMNS_5 = 'grid grid-cols-[2.2fr_1fr_1fr_1fr_0.9fr] gap-3 px-5';
const COLUMNS_6 = 'grid grid-cols-[1.8fr_0.7fr_1fr_1fr_1fr_0.9fr] gap-3 px-5';

export default function ReportsPage() {
  const [month, setMonth] = useState(currentMonth());
  const monthlyQuery = useMonthlyReport(month);
  const profitabilityQuery = useProfitabilityReport();
  const expenseQuery = useExpenseReport();
  const revenueQuery = useRevenueReport();

  const { data: monthly } = monthlyQuery;
  const { data: profitability } = profitabilityQuery;
  const { data: expenses } = expenseQuery;
  const { data: revenue } = revenueQuery;

  const showProfitabilityCurrency = new Set(profitability?.map((p) => p.currency)).size > 1;
  const columns = showProfitabilityCurrency ? COLUMNS_6 : COLUMNS_5;

  const breakdownCurrencies = [
    ...new Set([...(expenses ?? []).map((e) => e.currency), ...(revenue ?? []).map((r) => r.currency)]),
  ];
  const showBreakdownCurrency = breakdownCurrencies.length > 1;
  const breakdownRows: Currency[] = breakdownCurrencies.length > 0 ? breakdownCurrencies : ['USD'];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reports"
        subtitle="Four cuts of the same ledger — by month, project, category, and client."
      />

      <Card>
        <SectionHeading
          className="mb-4"
          aside={
            <input
              type="month"
              aria-label="Month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className={inputClass}
            />
          }
        >
          Monthly summary
        </SectionHeading>

        {monthlyQuery.isLoading && <Skeleton className="h-24 rounded-xl" />}
        {monthlyQuery.isError && (
          <ErrorState message="Couldn't load the monthly summary." onRetry={monthlyQuery.refetch} />
        )}
        {monthly && (
          <>
            <div className="mb-3 font-display text-lg italic text-ink-muted">
              {monthLabel(month)}
            </div>
            <div className="space-y-3">
              {(monthly.length > 0 ? monthly : [{ month, currency: 'USD' as const, revenue: 0, expenses: 0, profit: 0 }]).map(
                (m) => (
                  <div key={m.currency}>
                    {monthly.length > 1 && (
                      <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                        {m.currency}
                      </div>
                    )}
                    <StatRow
                      stats={[
                        { label: 'Revenue', value: moneyRounded(m.revenue, m.currency) },
                        { label: 'Expenses', value: moneyRounded(m.expenses, m.currency), tone: 'negative' },
                        {
                          label: 'Profit',
                          value: moneyRounded(m.profit, m.currency),
                          tone: 'accent',
                          ruled: true,
                        },
                      ]}
                    />
                  </div>
                ),
              )}
            </div>
          </>
        )}
      </Card>

      <section className="space-y-3">
        {profitabilityQuery.isLoading && <ListSkeleton rows={3} />}
        {profitabilityQuery.isError && (
          <ErrorState message="Couldn't load profitability." onRetry={profitabilityQuery.refetch} />
        )}
        {profitability && (
          <Card padded={false}>
            <div className="border-b border-hair px-5 py-4">
              <h2 className="font-display text-lg italic text-ink sm:text-xl">
                Profitability by project
              </h2>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[36rem]">
                <div className={`${columns} border-b border-hair py-3`}>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
                    Project
                  </span>
                  {showProfitabilityCurrency && (
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
                      Currency
                    </span>
                  )}
                  {['Income', 'Expenses', 'Profit', 'Margin'].map((h) => (
                    <span
                      key={h}
                      className="text-right font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted"
                    >
                      {h}
                    </span>
                  ))}
                </div>
                {profitability.length === 0 && (
                  <p className="px-5 py-6 text-center text-sm text-ink-muted">No projects yet.</p>
                )}
                {profitability.map((p) => (
                  <div
                    key={`${p.projectId}:${p.currency}`}
                    className={`${columns} items-center border-t border-hair py-3.5`}
                  >
                    <span className="truncate text-sm text-ink">{p.name}</span>
                    {showProfitabilityCurrency && (
                      <span className="font-mono text-xs text-ink-muted">{p.currency}</span>
                    )}
                    <span className="text-right font-tabular font-mono text-sm text-ink">
                      {money(p.income, p.currency)}
                    </span>
                    <span className="text-right font-tabular font-mono text-sm text-negative">
                      {money(p.expenses, p.currency)}
                    </span>
                    <span className="text-right font-tabular font-mono text-sm text-ink">
                      {money(p.profit, p.currency)}
                    </span>
                    <span className="text-right font-tabular font-mono text-sm text-accent">
                      {percent(p.margin)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </section>

      <div className="space-y-6">
        {breakdownRows.map((currency) => {
          const categoryEntries = (expenses ?? []).filter((e) => e.currency === currency);
          const clientEntries = (revenue ?? []).filter((r) => r.currency === currency);
          const expenseTotal = categoryEntries.reduce((sum, e) => sum + e.total, 0);
          const revenueTotal = clientEntries.reduce((sum, r) => sum + r.total, 0);

          return (
            <div key={currency}>
              {showBreakdownCurrency && (
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                  {currency}
                </div>
              )}
              <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
                <Card>
                  <h2 className="mb-1 font-display text-lg italic text-ink sm:text-xl">
                    Expenses by category
                  </h2>
                  {expenseQuery.isLoading && <Skeleton className="h-48" />}
                  {expenseQuery.isError && (
                    <ErrorState message="Couldn't load expense breakdown." onRetry={expenseQuery.refetch} />
                  )}
                  {expenses && categoryEntries.length === 0 && (
                    <p className="text-sm text-ink-muted">No expenses yet.</p>
                  )}
                  {categoryEntries.map((e) => (
                    <MeterRow
                      key={e.category}
                      label={formatCategory(e.category)}
                      value={money(e.total, e.currency)}
                      share={expenseTotal > 0 ? e.total / expenseTotal : 0}
                      tone="negative"
                    />
                  ))}
                </Card>

                <Card>
                  <h2 className="mb-1 font-display text-lg italic text-ink sm:text-xl">
                    Revenue by client
                  </h2>
                  {revenueQuery.isLoading && <Skeleton className="h-48" />}
                  {revenueQuery.isError && (
                    <ErrorState message="Couldn't load revenue by client." onRetry={revenueQuery.refetch} />
                  )}
                  {revenue && clientEntries.length === 0 && (
                    <p className="text-sm text-ink-muted">No revenue yet.</p>
                  )}
                  {clientEntries.map((r) => (
                    <MeterRow
                      key={r.clientId ?? 'none'}
                      label={r.clientName}
                      value={money(r.total, r.currency)}
                      share={revenueTotal > 0 ? r.total / revenueTotal : 0}
                    />
                  ))}
                </Card>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
