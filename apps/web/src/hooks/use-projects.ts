import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Currency } from '@/lib/ui';

export type DealType = 'ongoing' | 'one_time';

export interface ProfitTotals {
  currency: Currency;
  income: number;
  expenses: number;
  profit: number;
}

export interface Project {
  id: string;
  name: string;
  status: string;
  dealType: DealType;
  clientId?: string | null;
  startDate?: string | null;
}
export interface ProjectDetail extends Project { totals: ProfitTotals[]; }

export interface CreateProjectInput {
  name: string;
  clientId?: string | null;
  status?: string;
  startDate?: string | null;
  dealType?: DealType;
  /** One-time sale only. */
  saleAmount?: number;
  saleCurrency?: Currency;
  cost?: number;
}

export interface ProjectFilters {
  search?: string;
  status?: string;
  clientId?: string;
  dealType?: DealType;
}

export function useProjects(filters: ProjectFilters = {}) {
  const query = new URLSearchParams();
  if (filters.search) query.set('search', filters.search);
  if (filters.status) query.set('status', filters.status);
  if (filters.clientId) query.set('clientId', filters.clientId);
  if (filters.dealType) query.set('dealType', filters.dealType);
  const suffix = query.size ? `?${query.toString()}` : '';

  return useQuery({
    queryKey: ['projects', filters],
    queryFn: () => apiClient.get<Project[]>(`/projects${suffix}`),
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => apiClient.get<ProjectDetail>(`/projects/${id}`),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateProjectInput) => apiClient.post<Project>('/projects', dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useUpdateProject(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: Partial<CreateProjectInput>) => apiClient.patch<Project>(`/projects/${id}`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', id] });
    },
  });
}

export function useArchiveProject(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post<Project>(`/projects/${id}/archive`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', id] });
    },
  });
}
