import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Page } from './pagination';
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
  /** Ongoing projects only — an optional spending target, compared against actual expenses. */
  budget?: number | null;
  budgetCurrency?: Currency | null;
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
  /** Ongoing projects only. */
  budget?: number | null;
  budgetCurrency?: Currency | null;
}

export interface ProjectFilters {
  search?: string;
  status?: string;
  clientId?: string;
  dealType?: DealType;
}

export function useProjects(filters: ProjectFilters = {}) {
  return useInfiniteQuery({
    queryKey: ['projects', filters],
    queryFn: ({ pageParam }) => {
      const query = new URLSearchParams();
      if (filters.search) query.set('search', filters.search);
      if (filters.status) query.set('status', filters.status);
      if (filters.clientId) query.set('clientId', filters.clientId);
      if (filters.dealType) query.set('dealType', filters.dealType);
      if (pageParam) query.set('cursor', pageParam);
      const suffix = query.size ? `?${query.toString()}` : '';
      return apiClient.get<Page<Project>>(`/projects${suffix}`);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
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
