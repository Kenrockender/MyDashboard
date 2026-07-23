import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface Client {
  id: string;
  name: string;
  email?: string;
}

export function useClients(search?: string) {
  return useQuery({
    queryKey: ['clients', search],
    queryFn: () => apiClient.get<Client[]>(`/clients${search ? `?search=${search}` : ''}`),
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: { name: string; email?: string }) => apiClient.post<Client>('/clients', dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });
}
