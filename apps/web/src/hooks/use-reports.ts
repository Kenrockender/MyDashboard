import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface MonthlyReport {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface ProfitabilityEntry {
  projectId: string;
  name: string;
  income: number;
  expenses: number;
  profit: number;
  margin: number;
}

export interface ExpenseBreakdownEntry {
  category: string;
  total: number;
}

export interface RevenueBreakdownEntry {
  clientId: string | null;
  clientName: string;
  total: number;
}

export function useMonthlyReport(month: string) {
  return useQuery({
    queryKey: ['reports', 'monthly', month],
    queryFn: () => apiClient.get<MonthlyReport>(`/reports/monthly?month=${month}`),
    enabled: !!month,
  });
}

export function useProfitabilityReport() {
  return useQuery({
    queryKey: ['reports', 'profitability'],
    queryFn: () => apiClient.get<ProfitabilityEntry[]>('/reports/profitability'),
  });
}

export function useExpenseReport() {
  return useQuery({
    queryKey: ['reports', 'expenses'],
    queryFn: () => apiClient.get<ExpenseBreakdownEntry[]>('/reports/expenses?groupBy=category'),
  });
}

export function useRevenueReport() {
  return useQuery({
    queryKey: ['reports', 'revenue'],
    queryFn: () => apiClient.get<RevenueBreakdownEntry[]>('/reports/revenue?groupBy=client'),
  });
}
