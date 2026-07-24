import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface ProjectTotals { income: number; expenses: number; profit: number; }
export interface Project { id: string; name: string; status: string; }
export interface ProjectDetail extends Project { totals: ProjectTotals; }

export interface CreateProjectInput {
  name: string;
  clientId?: string;
  status?: string;
  startDate?: string;
}

export function useProjects(status?: string) {
  return useQuery({
    queryKey: ['projects', status],
    queryFn: () => apiClient.get<Project[]>(`/projects${status ? `?status=${status}` : ''}`),
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
