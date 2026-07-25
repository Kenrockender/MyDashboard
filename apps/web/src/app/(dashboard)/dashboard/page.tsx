'use client';
import Link from 'next/link';
import { useDashboardSummary } from '@/hooks/use-dashboard';
import { TrendChart } from '@/components/dashboard/trend-chart';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { PageHeader } from '@/components/ui/page-header';
import { StatGroup, type Stat } from '@/components/ui/stat-group';
import { Skeleton, StatGroupSkeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { moneyRounded, percent } from '@/lib/ui';

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

  const expenseShare =
    summary.totalRevenue > 0 ? summary.totalExpenses / summary.totalRevenue : 0;
  const margin = summary.totalRevenue > 0 ? summary.netProfit / summary.totalRevenue : 0;

  const stats: Stat[] = [
    { label: 'Total Revenue', value: moneyRounded(summary.totalRevenue) },
    {
      label: 'Total Expenses',
      value: moneyRounded(summary.totalExpenses),
      caption: summary.totalRevenue > 0 ? `${percent(expenseShare)} of revenue` : undefined,
    },
    {
      label: 'Net Profit',
      value: moneyRounded(summary.netProfit),
      tone: 'accent',
      ruled: true,
      caption: summary.totalRevenue > 0 ? `${percent(margin)} margin` : undefined,
    },
    {
      label: 'Active Projects',
      value: summary.activeProjects,
      caption: `${summary.completedProjects} completed`,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Everything tracked, paid, and reconciled."
        aside={<AsOf />}
      />

      <StatGroup stats={stats} />

      <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr] lg:items-start">
        <TrendChart data={summary.monthlyTrend} />

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
