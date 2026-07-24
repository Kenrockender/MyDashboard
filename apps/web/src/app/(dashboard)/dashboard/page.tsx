'use client';
import { useDashboardSummary } from '@/hooks/use-dashboard';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { TrendChart } from '@/components/dashboard/trend-chart';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { CardSkeleton, Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';

export default function DashboardPage() {
  const { data: summary, isLoading, isError, refetch } = useDashboardSummary();

  if (isError) return <ErrorState message="Couldn't load the dashboard." onRetry={refetch} />;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-2xl italic text-ink">Dashboard</h1>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (!summary) return <p className="text-sm text-ink-muted">No data yet.</p>;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl italic text-ink">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <KpiCard label="Revenue" value={`$${summary.totalRevenue.toFixed(2)}`} tone="accent" />
        <KpiCard label="Expenses" value={`$${summary.totalExpenses.toFixed(2)}`} tone="negative" />
        <KpiCard label="Net Profit" value={`$${summary.netProfit.toFixed(2)}`} tone="accent" />
        <KpiCard label="Active Projects" value={summary.activeProjects} />
        <KpiCard label="Completed Projects" value={summary.completedProjects} />
      </div>
      <TrendChart data={summary.monthlyTrend} />
      <div>
        <h2 className="mb-3 text-lg font-semibold text-ink">Recent Activity</h2>
        <RecentActivity items={summary.recentActivity} />
      </div>
    </div>
  );
}
