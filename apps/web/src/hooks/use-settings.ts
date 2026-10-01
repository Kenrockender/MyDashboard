import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

/** Mirrors the two answers to "How is your income taxed?" on the server. */
export type IncomeType = 'business' | 'professional';

export interface Settings {
  incomeType?: IncomeType;
}

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => apiClient.get<Settings>('/settings'),
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: Partial<Settings>) => apiClient.patch<Settings>('/settings', dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      // The PPh UMKM figure on Reports depends on incomeType, so a change here
      // must re-fetch the summary too.
      queryClient.invalidateQueries({ queryKey: ['reports', 'summary'] });
    },
  });
}
