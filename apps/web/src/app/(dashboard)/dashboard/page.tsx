'use client';
import { useDashboardSummary } from '@/hooks/use-dashboard';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { TrendChart } from '@/components/dashboard/trend-chart';
import { RecentActivity } from '@/components/dashboard/recent-activity';

export default function DashboardPage() {
  const { data: summary, isLoading } = useDashboardSummary();

  if (isLoading) return <p>Loading...</p>;
  if (!summary) return <p>No data yet.</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KpiCard label="Revenue" value={`$${summary.totalRevenue.toFixed(2)}`} />
        <KpiCard label="Expenses" value={`$${summary.totalExpenses.toFixed(2)}`} />
        <KpiCard label="Net Profit" value={`$${summary.netProfit.toFixed(2)}`} />
        <KpiCard label="Active Projects" value={summary.activeProjects} />
        <KpiCard label="Completed Projects" value={summary.completedProjects} />
      </div>
      <TrendChart data={summary.monthlyTrend} />
      <div>
        <h2 className="text-lg font-semibold mb-3">Recent Activity</h2>
        <RecentActivity items={summary.recentActivity} />
      </div>
    </div>
  );
}
