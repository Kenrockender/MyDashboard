import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Currency } from '@/lib/ui';

export interface OverdueIncomeEntry {
  id: string;
  projectId: string;
  projectName: string;
  amount: number;
  currency: Currency;
  date: string;
  kind: 'overdue' | 'pending_past_due';
}

export interface OverdueIncomeSummary {
  entries: OverdueIncomeEntry[];
  totalsByCurrency: { currency: Currency; total: number }[];
}

/** The one query in the app that polls — notifications are a passive
 *  "things you should know" signal, not something the user refreshes by
 *  navigating like every other list here. */
export function useOverdueIncome() {
  return useQuery({
    queryKey: ['notifications', 'overdue-income'],
    queryFn: () => apiClient.get<OverdueIncomeSummary>('/notifications/overdue-income'),
    refetchInterval: 5 * 60 * 1000,
  });
}
