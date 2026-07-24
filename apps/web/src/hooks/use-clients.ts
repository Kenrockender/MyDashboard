import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
}

export interface ClientInput {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
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
    mutationFn: (dto: ClientInput) => apiClient.post<Client>('/clients', dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<ClientInput> }) =>
      apiClient.patch<Client>(`/clients/${id}`, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });
}
