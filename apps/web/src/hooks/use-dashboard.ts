import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Currency } from '@/lib/ui';

export interface ProfitTotals {
  currency: Currency;
  income: number;
  expenses: number;
  profit: number;
}

export interface MonthlyTrendEntry {
  month: string;
  currency: Currency;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface RecentActivityEntry {
  type: 'income' | 'expense';
  projectId: string;
  amount: number;
  currency: Currency;
  date: string;
}

export interface DashboardSummary {
  totals: ProfitTotals[];
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
