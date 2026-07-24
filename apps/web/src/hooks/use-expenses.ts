import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface Expense {
  id: string;
  amount: number;
  category: string;
  description?: string;
  date: string;
}

export interface CreateExpenseInput {
  amount: number;
  category: string;
  description?: string;
  date: string;
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
