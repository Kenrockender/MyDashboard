import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// Matches src/server/attachments/dto/create-attachment.dto.ts#MAX_ATTACHMENT_BYTES —
// checked here too so the user gets instant feedback instead of a round-trip 400.
export const MAX_ATTACHMENT_BYTES = 700 * 1024;

export interface Attachment {
  id: string;
  expenseId: string;
  filename: string;
  mimeType: string;
  dataBase64: string;
  sizeBytes: number;
  createdAt: string;
}

export interface CreateAttachmentInput {
  filename: string;
  mimeType: string;
  dataBase64: string;
}

export function useAttachments(expenseId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['expenses', expenseId, 'attachments'],
    queryFn: () => apiClient.get<Attachment[]>(`/expenses/${expenseId}/attachments`),
    enabled: enabled && !!expenseId,
  });
}

export function useUploadAttachment(expenseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateAttachmentInput) =>
      apiClient.post<Attachment>(`/expenses/${expenseId}/attachments`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', expenseId, 'attachments'] });
    },
  });
}

export function useDeleteAttachment(expenseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<Attachment>(`/attachments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', expenseId, 'attachments'] });
    },
  });
}
