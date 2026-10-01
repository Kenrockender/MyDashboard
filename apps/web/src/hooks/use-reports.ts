import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Currency } from '@/lib/ui';
import type { MonthlyTrendEntry } from '@/hooks/use-dashboard';

export interface MonthlyReport {
  month: string;
  currency: Currency;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface ProfitabilityEntry {
  projectId: string;
  name: string;
  currency: Currency;
  income: number;
  expenses: number;
  profit: number;
  margin: number;
}

export interface ExpenseBreakdownEntry {
  category: string;
  currency: Currency;
  total: number;
}

export interface RevenueBreakdownEntry {
  clientId: string | null;
  clientName: string;
  currency: Currency;
  total: number;
}

export interface PphUmkmEstimate {
  year: number;
  grossRevenueIdr: number;
  exemptThresholdIdr: number;
  taxableAmountIdr: number;
  rate: number;
  estimatedTaxIdr: number;
}

export interface ReportsSummary {
  trend: MonthlyTrendEntry[];
  profitability: ProfitabilityEntry[];
  expenseBreakdown: ExpenseBreakdownEntry[];
  revenueBreakdown: RevenueBreakdownEntry[];
  /** Newest year first; the tax-year dropdown is built from this. Empty when incomeType is 'professional'. */
  taxEstimates: PphUmkmEstimate[];
  /** The user's answer to "how is your income taxed?", or undefined if unanswered. */
  incomeType?: 'business' | 'professional';
}

/**
 * One request for the whole Reports page. The month picker and tax-year
 * dropdown filter what's already here rather than refetching — the trend
 * covers every month, and estimates come back for a span of years.
 */
export function useReportsSummary() {
  return useQuery({
    queryKey: ['reports', 'summary'],
    queryFn: () => apiClient.get<ReportsSummary>('/reports/summary'),
  });
}

export function useMonthlyReport(month: string) {
  return useQuery({
    queryKey: ['reports', 'monthly', month],
    queryFn: () => apiClient.get<MonthlyReport[]>(`/reports/monthly?month=${month}`),
    enabled: !!month,
  });
}

export function useTrendReport() {
  return useQuery({
    queryKey: ['reports', 'trend'],
    queryFn: () => apiClient.get<MonthlyTrendEntry[]>('/reports/trend'),
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
