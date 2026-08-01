'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useDashboardSummary } from '@/hooks/use-dashboard';
import { TrendChart } from '@/components/dashboard/trend-chart';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { PageHeader } from '@/components/ui/page-header';
import { StatGroup, type Stat } from '@/components/ui/stat-group';
import { Skeleton, StatGroupSkeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { CurrencyToggle } from '@/components/ui/currency-toggle';
import { groupByCurrency, moneyCompact, moneyRounded, percent, type Currency } from '@/lib/ui';

const AS_OF = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' });

function AsOf() {
  return (
    <div className="text-right font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">
      As of
      <br />
      <span className="text-ink">{AS_OF.format(new Date())}</span>
    </div>
  );
}

export default function DashboardPage() {
  const { data: summary, isLoading, isError, refetch } = useDashboardSummary();

  if (isError) return <ErrorState message="Couldn't load the dashboard." onRetry={refetch} />;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" />
        <StatGroupSkeleton />
        <Skeleton className="h-80 rounded-[14px]" />
      </div>
    );
  }

  if (!summary) return <p className="text-sm text-ink-muted">No data yet.</p>;

  // A brand-new account has no totals yet — fall back to one empty USD group so
  // the layout still shows $0 rather than nothing.
  const totalsGroups =
    summary.totals.length > 0 ? summary.totals : [{ currency: 'USD' as const, income: 0, expenses: 0, profit: 0 }];
  const multiCurrency = totalsGroups.length > 1;

  const trendByCurrency = groupByCurrency(summary.monthlyTrend, (t) => t.currency);

  return (
    <DashboardBody
      summary={summary}
      totalsGroups={totalsGroups}
      multiCurrency={multiCurrency}
      trendByCurrency={trendByCurrency}
    />
  );
}

function DashboardBody({
  summary,
  totalsGroups,
  multiCurrency,
  trendByCurrency,
}: {
  summary: NonNullable<ReturnType<typeof useDashboardSummary>['data']>;
  totalsGroups: { currency: Currency; income: number; expenses: number; profit: number }[];
  multiCurrency: boolean;
  trendByCurrency: { currency: Currency; items: (typeof summary.monthlyTrend)[number][] }[];
}) {
  const [selected, setSelected] = useState<Currency>(totalsGroups[0].currency);
  const activeCurrency = totalsGroups.some((t) => t.currency === selected) ? selected : totalsGroups[0].currency;
  const shownGroups = multiCurrency ? totalsGroups.filter((t) => t.currency === activeCurrency) : totalsGroups;
  const shownTrend = multiCurrency
    ? trendByCurrency.filter(({ currency }) => currency === activeCurrency)
    : trendByCurrency;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Everything tracked, paid, and reconciled."
        aside={<AsOf />}
      />

      {multiCurrency && (
        <div className="flex justify-end">
          <CurrencyToggle
            currencies={totalsGroups.map((t) => t.currency)}
            selected={activeCurrency}
            onSelect={setSelected}
          />
        </div>
      )}

      <div className="space-y-4">
        {shownGroups.map((t, i) => {
          const stats: Stat[] = [
            {
              label: 'Total Revenue',
              value: moneyRounded(t.income, t.currency),
              valueCompact: moneyCompact(t.income, t.currency),
            },
            {
              label: 'Total Expenses',
              value: moneyRounded(t.expenses, t.currency),
              valueCompact: moneyCompact(t.expenses, t.currency),
              caption: t.income > 0 ? `${percent(t.expenses / t.income)} of revenue` : undefined,
            },
            {
              label: 'Net Profit',
              value: moneyRounded(t.profit, t.currency),
              valueCompact: moneyCompact(t.profit, t.currency),
              tone: 'accent',
              ruled: true,
              caption: t.income > 0 ? `${percent(t.profit / t.income)} margin` : undefined,
            },
          ];
          // Project counts are currency-agnostic, so they only belong on the first group.
          if (i === 0) {
            stats.push({
              label: 'Active Projects',
              value: summary.activeProjects,
              caption: `${summary.completedProjects} completed`,
            });
          }
          return <StatGroup key={t.currency} stats={stats} />;
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr] lg:items-start">
        <div className="space-y-6">
          {shownTrend.length > 0 ? (
            shownTrend.map(({ currency, items }) => (
              <TrendChart key={currency} data={items} currency={currency} />
            ))
          ) : (
            <TrendChart data={[]} currency="USD" />
          )}
        </div>

        <div className="overflow-hidden rounded-[14px] border border-border bg-paper-raised">
          <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-4">
            <h2 className="font-display text-lg italic text-ink sm:text-xl">Recent activity</h2>
            <Link href="/projects" className="text-xs text-ink-muted hover:text-ink">
              View all
            </Link>
          </div>
          <RecentActivity items={summary.recentActivity} />
        </div>
      </div>
    </div>
  );
}
