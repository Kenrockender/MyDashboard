import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Page } from './pagination';

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

// Dropdowns/lookups (project client picker, invoice list join, etc.) need the
// whole roster, not a browsable page — so this stays a flat Client[] and just
// requests one generously-sized page under the hood instead of paginating.
// A solo user isn't going to have thousands of clients; this still bounds
// the query instead of the old unlimited fetch.
const DROPDOWN_PAGE_SIZE = 500;

export function useClients(search?: string) {
  return useQuery({
    queryKey: ['clients', search],
    queryFn: async () => {
      const query = new URLSearchParams({ limit: String(DROPDOWN_PAGE_SIZE) });
      if (search) query.set('search', search);
      const page = await apiClient.get<Page<Client>>(`/clients?${query.toString()}`);
      return page.items;
    },
  });
}

/** Paginated variant for the browsable Clients page — "Load more" instead of fetching everything. */
export function useClientsInfinite(search?: string) {
  return useInfiniteQuery({
    queryKey: ['clients', 'infinite', search],
    queryFn: ({ pageParam }) => {
      const query = new URLSearchParams();
      if (search) query.set('search', search);
      if (pageParam) query.set('cursor', pageParam);
      const suffix = query.size ? `?${query.toString()}` : '';
      return apiClient.get<Page<Client>>(`/clients${suffix}`);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
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
