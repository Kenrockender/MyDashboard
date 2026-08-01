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

export type RecurrenceInterval = 'weekly' | 'monthly' | 'yearly';

export interface UpcomingRecurringExpenseEntry {
  id: string;
  projectId: string;
  projectName: string;
  description: string;
  amount: number;
  currency: Currency;
  category: string;
  interval: RecurrenceInterval;
  nextDueDate: string;
}

export interface UpcomingRecurringExpensesSummary {
  entries: UpcomingRecurringExpenseEntry[];
}

export interface NotificationsSummary {
  overdueIncome: OverdueIncomeSummary;
  upcomingRecurringExpenses: UpcomingRecurringExpensesSummary;
}

/**
 * The one query in the app that polls — notifications are a passive "things
 * you should know" signal, not something the user refreshes by navigating
 * like every other list here.
 *
 * Both kinds come from one endpoint, and polling pauses when the tab is in
 * the background: overdue income and upcoming bills move on the scale of
 * days, so a tab left open overnight was spending reads on the fact that
 * nothing had changed.
 */
const POLL_INTERVAL_MS = 15 * 60 * 1000;

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiClient.get<NotificationsSummary>('/notifications'),
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
  });
}
