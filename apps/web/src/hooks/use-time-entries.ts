import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Currency } from '@/lib/ui';

export interface TimeEntry {
  id: string;
  hours: number;
  description?: string;
  date: string;
  hourlyRate?: number;
  currency: Currency;
  status: 'unlogged' | 'logged';
  incomeId?: string | null;
}

export interface CreateTimeEntryInput {
  hours: number;
  description?: string;
  date: string;
  hourlyRate?: number;
  currency?: Currency;
}

export function useTimeEntries(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId, 'time-entries'],
    queryFn: () => apiClient.get<TimeEntry[]>(`/projects/${projectId}/time-entries`),
    enabled: !!projectId,
  });
}

export function useCreateTimeEntry(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateTimeEntryInput) =>
      apiClient.post<TimeEntry>(`/projects/${projectId}/time-entries`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'time-entries'] });
    },
  });
}

export function useUpdateTimeEntry(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateTimeEntryInput> }) =>
      apiClient.patch<TimeEntry>(`/time-entries/${id}`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'time-entries'] });
    },
  });
}

export function useLogTimeEntryAsIncome(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post<TimeEntry>(`/time-entries/${id}/log-income`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'time-entries'] });
      // Logging creates a real Income record — Income list and project totals need to refresh too.
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'income'] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    },
  });
}

export function useDeleteTimeEntry(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<TimeEntry>(`/time-entries/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'time-entries'] });
    },
  });
}
