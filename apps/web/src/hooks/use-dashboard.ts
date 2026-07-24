import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface MonthlyTrendEntry {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface RecentActivityEntry {
  type: 'income' | 'expense';
  projectId: string;
  amount: number;
  date: string;
}

export interface DashboardSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  activeProjects: number;
  completedProjects: number;
  monthlyTrend: MonthlyTrendEntry[];
  recentActivity: RecentActivityEntry[];
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => apiClient.get<DashboardSummary>('/dashboard/summary'),
  });
}
