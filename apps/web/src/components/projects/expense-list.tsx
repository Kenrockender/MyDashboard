'use client';
import { useRef, useState } from 'react';
import {
  useExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  type Expense,
  type RecurrenceInterval,
} from '@/hooks/use-expenses';
import {
  useAttachments,
  useUploadAttachment,
  useDeleteAttachment,
  MAX_ATTACHMENT_BYTES,
} from '@/hooks/use-attachments';
import { Badge } from '@/components/ui/badge';
import { Button, LinkButton } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { CurrencySelect } from '@/components/ui/currency-select';
import { Select } from '@/components/ui/select';
import { ListSkeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { useToast } from '@/lib/toast-context';
import { useConfirm } from '@/lib/confirm-context';
import { base64ToBlob, downloadBlob, formatCategory, inputClass, money, type Currency } from '@/lib/ui';

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
function ExpenseAttachments({ expenseId }: { expenseId: string }) {
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

const EXPENSE_CATEGORIES = [
  'hosting',
  'domain',
  'api_usage',
  'software_subscription',
  'freelancer',
  'marketing',
  'miscellaneous',
];

const RECURRENCE_INTERVALS: RecurrenceInterval[] = ['weekly', 'monthly', 'yearly'];

function ExpenseRow({
  expense,
  onUpdate,
  onDelete,
}: {
  expense: Expense;
  onUpdate: (
    id: string,
    dto: {
      amount: number;
      currency: Currency;
      category: string;
      description?: string;
      date: string;
      isRecurring: boolean;
      recurrenceInterval: RecurrenceInterval | null;
    },
    onDone: () => void,
  ) => void;
  onDelete: (id: string, amount: number, currency: Currency) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [amount, setAmount] = useState(String(expense.amount));
  const [currency, setCurrency] = useState<Currency>(expense.currency);
  const [category, setCategory] = useState(expense.category);
  const [description, setDescription] = useState(expense.description ?? '');
  const [date, setDate] = useState(expense.date.slice(0, 10));
  const [isRecurring, setIsRecurring] = useState(expense.isRecurring ?? false);
  const [recurrenceInterval, setRecurrenceInterval] = useState<RecurrenceInterval>(
    expense.recurrenceInterval ?? 'monthly',
  );

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !date) return;
    onUpdate(
      expense.id,
      {
        amount: Number(amount),
        currency,
        category,
        description: description || undefined,
        date,
        isRecurring,
        recurrenceInterval: isRecurring ? recurrenceInterval : null,
      },
      () => setEditing(false),
    );
  }

  if (editing) {
    return (
      <li className="border-t border-hair px-5 py-4">
        <form onSubmit={handleSave} className="grid gap-3 sm:grid-cols-2">
          <Field label="Amount">
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputClass}
            />
          </Field>
          <CurrencySelect value={currency} onChange={setCurrency} />
          <Field label="Date">
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Category">
            <Select
              value={category}
              onChange={setCategory}
              options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: formatCategory(c) }))}
            />
          </Field>
          <Field label="Description">
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
            />
          </Field>
          <div className="flex items-end gap-3 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              Recurring
            </label>
            {isRecurring && (
              <Select
                value={recurrenceInterval}
                onChange={(v) => setRecurrenceInterval(v as RecurrenceInterval)}
                options={RECURRENCE_INTERVALS.map((i) => ({ value: i, label: i }))}
                className="w-32"
              />
            )}
          </div>
          <div className="flex items-center gap-4 sm:col-span-2">
            <Button type="submit">Save</Button>
            <LinkButton type="button" onClick={() => setEditing(false)}>
              Cancel
            </LinkButton>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="group border-t border-hair px-5 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm text-ink">{expense.description || 'Expense'}</span>
            {expense.isRecurring && expense.recurrenceInterval && (
              <Badge tone="neutral">{expense.recurrenceInterval}</Badge>
            )}
          </div>
          <div className="mt-0.5 text-xs capitalize text-ink-muted">
            {formatCategory(expense.category)} · {expense.date.slice(0, 10)}
          </div>
        </div>
        <div className="flex flex-none items-center gap-4">
          <span className="font-tabular font-mono text-sm text-negative">
            {money(Number(expense.amount), expense.currency)}
          </span>
          <div className="flex gap-3 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
            <LinkButton onClick={() => setShowAttachments((v) => !v)}>
              {showAttachments ? 'Hide files' : 'Files'}
            </LinkButton>
            <LinkButton onClick={() => setEditing(true)}>Edit</LinkButton>
            <LinkButton
              tone="negative"
              onClick={() => onDelete(expense.id, Number(expense.amount), expense.currency)}
              aria-label={`Delete expense of ${money(Number(expense.amount), expense.currency)}`}
            >
              Delete
            </LinkButton>
          </div>
        </div>
      </div>
      {showAttachments && <ExpenseAttachments expenseId={expense.id} />}
    </li>
  );
}

export function ExpenseList({ projectId }: { projectId: string }) {
  const { data: expenses, isLoading, isError, refetch } = useExpenses(projectId);
  const createExpense = useCreateExpense(projectId);
  const updateExpense = useUpdateExpense(projectId);
  const deleteExpense = useDeleteExpense(projectId);
  const { showToast } = useToast();
  const confirm = useConfirm();

  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceInterval, setRecurrenceInterval] = useState<RecurrenceInterval>('monthly');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !date) return;
    createExpense.mutate(
      {
        amount: Number(amount),
        currency,
        category,
        description: description || undefined,
        date,
        isRecurring,
        recurrenceInterval: isRecurring ? recurrenceInterval : null,
      },
      {
        onSuccess: () => {
          setAmount('');
          setDescription('');
          setDate('');
          setIsRecurring(false);
          showToast('Expense added.');
        },
        onError: () => showToast("Couldn't add expense — try again.", 'error'),
      },
    );
  }

  function handleUpdate(
    id: string,
    dto: {
      amount: number;
      currency: Currency;
      category: string;
      description?: string;
      date: string;
      isRecurring: boolean;
      recurrenceInterval: RecurrenceInterval | null;
    },
    onDone: () => void,
  ) {
    updateExpense.mutate(
      { id, dto },
      {
        onSuccess: () => {
          onDone();
          showToast('Expense updated.');
        },
        onError: () => showToast("Couldn't update expense — try again.", 'error'),
      },
    );
  }

  async function handleDelete(id: string, amount: number, currency: Currency) {
    const confirmed = await confirm({
      message: `Delete this expense of ${money(amount, currency)}?`,
      confirmLabel: 'Delete',
      tone: 'negative',
    });
    if (!confirmed) return;
    deleteExpense.mutate(id, {
      onSuccess: () => showToast('Expense deleted.'),
      onError: () => showToast("Couldn't delete expense — try again.", 'error'),
    });
  }

  return (
    <div className="overflow-hidden rounded-[14px] border border-border bg-paper-raised">
      <div className="px-5 pb-3 pt-4">
        <h2 className="font-display text-lg italic text-ink sm:text-xl">Expenses</h2>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3 border-t border-hair px-5 py-4 sm:grid-cols-2">
        <Field label="Amount">
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={inputClass}
          />
        </Field>
        <CurrencySelect value={currency} onChange={setCurrency} />
        <Field label="Category">
          <Select
            value={category}
            onChange={setCategory}
            options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: formatCategory(c) }))}
          />
        </Field>
        <Field label="Date">
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Description" className="sm:col-span-2">
          <input
            placeholder="What it was for"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
          />
        </Field>
        <div className="flex items-end gap-3 sm:col-span-2">
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Recurring
          </label>
          {isRecurring && (
            <Select
              value={recurrenceInterval}
              onChange={(v) => setRecurrenceInterval(v as RecurrenceInterval)}
              options={RECURRENCE_INTERVALS.map((i) => ({ value: i, label: i }))}
              className="w-32"
            />
          )}
        </div>
        <Button type="submit" disabled={createExpense.isPending} className="justify-self-start">
          Add expense
        </Button>
      </form>

      {isLoading && <ListSkeleton rows={2} />}
      {isError && (
        <div className="px-5 py-4">
          <ErrorState message="Couldn't load expenses." onRetry={refetch} />
        </div>
      )}
      {!isLoading && !isError && (
        <ul className="m-0 list-none p-0">
          {expenses?.length === 0 && (
            <li className="border-t border-hair px-5 py-5 text-center text-sm text-ink-muted">
              No expenses logged yet.
            </li>
          )}
          {expenses?.map((e) => (
            <ExpenseRow key={e.id} expense={e} onUpdate={handleUpdate} onDelete={handleDelete} />
          ))}
        </ul>
      )}
    </div>
  );
}
