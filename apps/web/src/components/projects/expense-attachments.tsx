'use client';
import { useRef } from 'react';
import {
  useAttachments,
  useUploadAttachment,
  useDeleteAttachment,
  MAX_ATTACHMENT_BYTES,
} from '@/hooks/use-attachments';
import { LinkButton } from '@/components/ui/button';
import { useToast } from '@/lib/toast-context';
import { useConfirm } from '@/lib/confirm-context';
import { base64ToBlob, downloadBlob } from '@/lib/ui';

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Receipts attach directly to Firestore as base64 — no external storage is
 *  wired up (would need e.g. Cloudflare R2), so this only fits small files;
 *  the size cap mirrors the API's MAX_ATTACHMENT_BYTES check. */
export function ExpenseAttachments({ expenseId }: { expenseId: string }) {
  const { data: attachments, isLoading } = useAttachments(expenseId, true);
  const uploadAttachment = useUploadAttachment(expenseId);
  const deleteAttachment = useDeleteAttachment(expenseId);
  const { showToast } = useToast();
  const confirm = useConfirm();
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_BYTES) {
      showToast(
        `That file is ${(file.size / 1024).toFixed(0)}KB — attachments are limited to ${MAX_ATTACHMENT_BYTES / 1024}KB.`,
        'error',
      );
      return;
    }
    const dataBase64 = await readFileAsBase64(file);
    uploadAttachment.mutate(
      { filename: file.name, mimeType: file.type || 'application/octet-stream', dataBase64 },
      {
        onSuccess: () => showToast('Attachment added.'),
        onError: () => showToast("Couldn't upload attachment — try again.", 'error'),
      },
    );
  }

  function handleView(att: { dataBase64: string; mimeType: string; filename: string }) {
    downloadBlob(base64ToBlob(att.dataBase64, att.mimeType), att.filename);
  }

  async function handleDelete(att: { id: string; filename: string }) {
    const confirmed = await confirm({
      message: `Remove attachment "${att.filename}"?`,
      confirmLabel: 'Remove',
      tone: 'negative',
    });
    if (!confirmed) return;
    deleteAttachment.mutate(att.id, {
      onSuccess: () => showToast('Attachment removed.'),
      onError: () => showToast("Couldn't remove attachment — try again.", 'error'),
    });
  }

  return (
    <div className="mt-2 border-t border-hair pt-2">
      {isLoading && <p className="text-xs text-ink-muted">Loading attachments…</p>}
      {!isLoading && attachments?.length === 0 && (
        <p className="text-xs text-ink-muted">No attachments yet.</p>
      )}
      <ul className="m-0 list-none space-y-1 p-0">
        {attachments?.map((att) => (
          <li key={att.id} className="flex items-center justify-between gap-2 text-xs">
            <button
              onClick={() => handleView(att)}
              className="min-w-0 truncate text-left text-accent hover:underline"
            >
              {att.filename}
            </button>
            <LinkButton tone="negative" onClick={() => handleDelete(att)}>
              Remove
            </LinkButton>
          </li>
        ))}
      </ul>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="mt-2 block w-full text-xs text-ink-muted file:mr-3 file:rounded-md file:border-0 file:bg-accent-soft file:px-2.5 file:py-1 file:text-xs file:font-medium file:text-accent"
      />
    </div>
  );
}
