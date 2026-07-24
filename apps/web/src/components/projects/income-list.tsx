'use client';
import { useState } from 'react';
import { useIncome, useCreateIncome, useUpdateIncome, useDeleteIncome, type Income } from '@/hooks/use-income';
import { ListSkeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { useToast } from '@/lib/toast-context';

const inputClass =
  'rounded-md border border-border bg-paper-raised px-2.5 py-1.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent/40';

const INCOME_STATUSES = ['pending', 'paid', 'overdue'];

function IncomeRow({
  income,
  onUpdate,
  onDelete,
}: {
  income: Income;
  onUpdate: (
    id: string,
    dto: { amount: number; description?: string; status: string; date: string },
    onDone: () => void,
  ) => void;
  onDelete: (id: string, amount: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(String(income.amount));
  const [description, setDescription] = useState(income.description ?? '');
  const [status, setStatus] = useState(income.status);
  const [date, setDate] = useState(income.date.slice(0, 10));

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !date) return;
    onUpdate(
      income.id,
      { amount: Number(amount), description: description || undefined, status, date },
      () => setEditing(false),
    );
  }

  if (editing) {
    return (
      <li className="px-4 py-2.5">
        <form onSubmit={handleSave} className="flex flex-wrap gap-2">
          <input
            type="number"
            step="0.01"
            aria-label="Amount"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={`${inputClass} w-28`}
          />
          <input
            type="date"
            aria-label="Date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Payment status"
            className={inputClass}
          >
            {INCOME_STATUSES.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
          <input
            placeholder="Description"
            aria-label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${inputClass} flex-1 min-w-[8rem]`}
          />
          <button type="submit" className="text-sm font-medium text-accent hover:underline">Save</button>
          <button type="button" onClick={() => setEditing(false)} className="text-sm font-medium text-ink-muted hover:underline">
            Cancel
          </button>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-4 px-4 py-2.5">
      <span className="text-sm text-ink">
        <span className="font-tabular font-mono text-accent">${Number(income.amount).toFixed(2)}</span>
        {' — '}
        {income.description || income.status} — {income.date.slice(0, 10)}
      </span>
      <span className="flex shrink-0 gap-3">
        <button
          onClick={() => setEditing(true)}
          className="text-sm font-medium text-ink-muted hover:text-ink hover:underline"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(income.id, Number(income.amount))}
          aria-label={`Delete income of $${Number(income.amount).toFixed(2)}`}
          className="text-sm font-medium text-negative hover:underline"
        >
          Delete
        </button>
      </span>
    </li>
  );
}

export function IncomeList({ projectId }: { projectId: string }) {
  const { data: income, isLoading, isError, refetch } = useIncome(projectId);
  const createIncome = useCreateIncome(projectId);
  const updateIncome = useUpdateIncome(projectId);
  const deleteIncome = useDeleteIncome(projectId);
  const { showToast } = useToast();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState(INCOME_STATUSES[0]);
  const [date, setDate] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !date) return;
    createIncome.mutate(
      { amount: Number(amount), description: description || undefined, status, date },
      {
        onSuccess: () => {
          setAmount('');
          setDescription('');
          setStatus(INCOME_STATUSES[0]);
          setDate('');
          showToast('Income added.');
        },
        onError: () => showToast("Couldn't add income — try again.", 'error'),
      },
    );
  }

  function handleUpdate(id: string, dto: { amount: number; description?: string; date: string }, onDone: () => void) {
    updateIncome.mutate(
      { id, dto },
      {
        onSuccess: () => {
          onDone();
          showToast('Income updated.');
        },
        onError: () => showToast("Couldn't update income — try again.", 'error'),
      },
    );
  }

  function handleDelete(id: string, amount: number) {
    if (!window.confirm(`Delete this income of $${amount.toFixed(2)}?`)) return;
    deleteIncome.mutate(id, {
      onSuccess: () => showToast('Income deleted.'),
      onError: () => showToast("Couldn't delete income — try again.", 'error'),
    });
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-ink">Income</h2>
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-2">
        <input
          type="number"
          step="0.01"
          placeholder="Amount"
          aria-label="Amount"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={`${inputClass} w-28`}
        />
        <input
          type="date"
          aria-label="Date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={inputClass}
        />
        <input
          placeholder="Description"
          aria-label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={`${inputClass} flex-1 min-w-[8rem]`}
        />
        <button
          type="submit"
          disabled={createIncome.isPending}
          className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-border/30 disabled:opacity-60"
        >
          Add income
        </button>
      </form>

      {isLoading && <ListSkeleton rows={2} />}
      {isError && <ErrorState message="Couldn't load income." onRetry={refetch} />}
      {!isLoading && !isError && (
        <ul className="divide-y divide-border rounded-lg border border-border bg-paper-raised">
          {income?.length === 0 && (
            <li className="px-4 py-4 text-center text-sm text-ink-muted">No income logged yet.</li>
          )}
          {income?.map((i) => (
            <IncomeRow key={i.id} income={i} onUpdate={handleUpdate} onDelete={handleDelete} />
          ))}
        </ul>
      )}
    </div>
  );
}
