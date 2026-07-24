import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface Income {
  id: string;
  amount: number;
  description?: string;
  status: string;
  date: string;
}

export interface CreateIncomeInput {
  amount: number;
  description?: string;
  status?: string;
  date: string;
}

export function useIncome(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId, 'income'],
    queryFn: () => apiClient.get<Income[]>(`/projects/${projectId}/income`),
    enabled: !!projectId,
  });
}

export function useCreateIncome(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateIncomeInput) => apiClient.post<Income>(`/projects/${projectId}/income`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'income'] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    },
  });
}

export function useDeleteIncome(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<Income>(`/income/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'income'] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    },
  });
}
