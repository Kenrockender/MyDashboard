import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface ProjectTotals { income: number; expenses: number; profit: number; }
export interface Project { id: string; name: string; status: string; }
export interface ProjectDetail extends Project { totals: ProjectTotals; }

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
