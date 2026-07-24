'use client';
import { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import {
  useMonthlyReport,
  useProfitabilityReport,
  useExpenseReport,
  useRevenueReport,
} from '@/hooks/use-reports';
import { Card } from '@/components/ui/card';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { CardSkeleton, Skeleton, ListSkeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';

const COLORS = ['#1f6f4f', '#af3f28', '#c9a227', '#4a6fa5', '#7c5cbf', '#2f8f8f', '#a45c8c'];

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

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

  return (
    <div className="space-y-10">
      <h1 className="font-display text-2xl italic text-ink">Reports</h1>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Monthly Summary</h2>
          <input
            type="month"
            aria-label="Month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-md border border-border bg-paper-raised px-2.5 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </div>
        {monthlyQuery.isLoading && (
          <div className="grid grid-cols-3 gap-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        )}
        {monthlyQuery.isError && (
          <ErrorState message="Couldn't load the monthly summary." onRetry={monthlyQuery.refetch} />
        )}
        {monthly && (
          <div className="grid grid-cols-3 gap-4">
            <KpiCard label="Revenue" value={`$${monthly.revenue.toFixed(2)}`} tone="accent" />
            <KpiCard label="Expenses" value={`$${monthly.expenses.toFixed(2)}`} tone="negative" />
            <KpiCard label="Profit" value={`$${monthly.profit.toFixed(2)}`} tone="accent" />
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink">Profitability by Project</h2>
        {profitabilityQuery.isLoading && <ListSkeleton rows={3} />}
        {profitabilityQuery.isError && (
          <ErrorState message="Couldn't load profitability." onRetry={profitabilityQuery.refetch} />
        )}
        {profitability && (
          <Card className="overflow-x-auto" padded={false}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-ink-muted">
                  <th className="px-4 py-2.5 font-medium">Project</th>
                  <th className="px-4 py-2.5 font-medium">Income</th>
                  <th className="px-4 py-2.5 font-medium">Expenses</th>
                  <th className="px-4 py-2.5 font-medium">Profit</th>
                  <th className="px-4 py-2.5 font-medium">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {profitability.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-ink-muted">
                      No projects yet.
                    </td>
                  </tr>
                )}
                {profitability.map((p) => (
                  <tr key={p.projectId}>
                    <td className="px-4 py-2.5 text-ink">{p.name}</td>
                    <td className="px-4 py-2.5 font-tabular font-mono text-ink">${p.income.toFixed(2)}</td>
                    <td className="px-4 py-2.5 font-tabular font-mono text-ink">${p.expenses.toFixed(2)}</td>
                    <td className="px-4 py-2.5 font-tabular font-mono text-ink">${p.profit.toFixed(2)}</td>
                    <td className="px-4 py-2.5 font-tabular font-mono text-ink">{(p.margin * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink">Expenses by Category</h2>
        {expenseQuery.isLoading && <Skeleton className="h-72" />}
        {expenseQuery.isError && (
          <ErrorState message="Couldn't load expense breakdown." onRetry={expenseQuery.refetch} />
        )}
        {expenses && expenses.length > 0 ? (
          <Card className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={expenses} dataKey="total" nameKey="category" outerRadius={90} label>
                  {expenses.map((entry, i) => (
                    <Cell key={entry.category} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--paper-raised)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        ) : (
          expenses && <p className="text-sm text-ink-muted">No expenses yet.</p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink">Revenue by Client</h2>
        {revenueQuery.isLoading && <ListSkeleton rows={2} />}
        {revenueQuery.isError && (
          <ErrorState message="Couldn't load revenue by client." onRetry={revenueQuery.refetch} />
        )}
        {revenue && (
          <ul className="divide-y divide-border rounded-lg border border-border bg-paper-raised">
            {revenue.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-ink-muted">No revenue yet.</li>
            )}
            {revenue.map((r) => (
              <li key={r.clientId ?? 'none'} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-ink">{r.clientName}</span>
                <span className="font-tabular font-mono text-ink">${r.total.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
