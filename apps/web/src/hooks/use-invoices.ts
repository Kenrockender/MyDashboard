import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Page } from './pagination';
import type { Currency } from '@/lib/ui';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

export interface Invoice {
  id: string;
  projectId: string;
  clientId: string | null;
  invoiceNumber: string;
  incomeIds: string[];
  currency: Currency;
  subtotal: number;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string | null;
  notes?: string | null;
  sentAt?: string | null;
  paidAt?: string | null;
}

export interface CreateInvoiceInput {
  incomeIds: string[];
  dueDate?: string;
  notes?: string;
}

export interface UpdateInvoiceInput {
  status?: InvoiceStatus;
  dueDate?: string;
  notes?: string;
}

export interface InvoiceFilters {
  status?: string;
  search?: string;
}

export function useInvoices(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId, 'invoices'],
    queryFn: () => apiClient.get<Invoice[]>(`/projects/${projectId}/invoices`),
    enabled: !!projectId,
  });
}

export function useAllInvoices(filters: InvoiceFilters = {}) {
  return useInfiniteQuery({
    queryKey: ['invoices', filters],
    queryFn: ({ pageParam }) => {
      const query = new URLSearchParams();
      if (filters.status) query.set('status', filters.status);
      if (filters.search) query.set('search', filters.search);
      if (pageParam) query.set('cursor', pageParam);
      const suffix = query.size ? `?${query.toString()}` : '';
      return apiClient.get<Page<Invoice>>(`/invoices${suffix}`);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useCreateInvoice(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateInvoiceInput) =>
      apiClient.post<Invoice>(`/projects/${projectId}/invoices`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useUpdateInvoiceStatus(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateInvoiceInput }) =>
      apiClient.patch<Invoice>(`/invoices/${id}`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useSendInvoice(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post<Invoice>(`/invoices/${id}/send`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useDeleteInvoice(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<Invoice>(`/invoices/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}
