import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Currency } from '@/lib/ui';

export type RecurrenceInterval = 'weekly' | 'monthly' | 'yearly';

export interface Expense {
  id: string;
  amount: number;
  currency: Currency;
  category: string;
  description?: string;
  date: string;
  isRecurring?: boolean;
  recurrenceInterval?: RecurrenceInterval | null;
}

export interface CreateExpenseInput {
  amount: number;
  currency?: Currency;
  category: string;
  description?: string;
  date: string;
  isRecurring?: boolean;
  recurrenceInterval?: RecurrenceInterval | null;
}

export function useExpenses(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId, 'expenses'],
    queryFn: () => apiClient.get<Expense[]>(`/projects/${projectId}/expenses`),
    enabled: !!projectId,
  });
}

export function useCreateExpense(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateExpenseInput) => apiClient.post<Expense>(`/projects/${projectId}/expenses`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'expenses'] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    },
  });
}

export function useUpdateExpense(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateExpenseInput> }) =>
      apiClient.patch<Expense>(`/expenses/${id}`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'expenses'] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    },
  });
}

export function useDeleteExpense(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<Expense>(`/expenses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'expenses'] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    },
  });
}
