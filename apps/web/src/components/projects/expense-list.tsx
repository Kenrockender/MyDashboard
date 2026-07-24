'use client';
import { useState } from 'react';
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense, type Expense } from '@/hooks/use-expenses';
import { ListSkeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { useToast } from '@/lib/toast-context';

const EXPENSE_CATEGORIES = [
  'hosting',
  'domain',
  'api_usage',
  'software_subscription',
  'freelancer',
  'marketing',
  'miscellaneous',
];

const inputClass =
  'rounded-md border border-border bg-paper-raised px-2.5 py-1.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent/40';

function ExpenseRow({
  expense,
  onUpdate,
  onDelete,
}: {
  expense: Expense;
  onUpdate: (
    id: string,
    dto: { amount: number; category: string; description?: string; date: string },
    onDone: () => void,
  ) => void;
  onDelete: (id: string, amount: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(String(expense.amount));
  const [category, setCategory] = useState(expense.category);
  const [description, setDescription] = useState(expense.description ?? '');
  const [date, setDate] = useState(expense.date.slice(0, 10));

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !date) return;
    onUpdate(expense.id, { amount: Number(amount), category, description: description || undefined, date }, () =>
      setEditing(false),
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
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Category"
            className={inputClass}
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
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
        <span className="font-tabular font-mono text-negative">${Number(expense.amount).toFixed(2)}</span>
        {' — '}
        {expense.category} — {expense.date.slice(0, 10)}
      </span>
      <span className="flex shrink-0 gap-3">
        <button
          onClick={() => setEditing(true)}
          className="text-sm font-medium text-ink-muted hover:text-ink hover:underline"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(expense.id, Number(expense.amount))}
          aria-label={`Delete expense of $${Number(expense.amount).toFixed(2)}`}
          className="text-sm font-medium text-negative hover:underline"
        >
          Delete
        </button>
      </span>
    </li>
  );
}

export function ExpenseList({ projectId }: { projectId: string }) {
  const { data: expenses, isLoading, isError, refetch } = useExpenses(projectId);
  const createExpense = useCreateExpense(projectId);
  const updateExpense = useUpdateExpense(projectId);
  const deleteExpense = useDeleteExpense(projectId);
  const { showToast } = useToast();

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !date) return;
    createExpense.mutate(
      { amount: Number(amount), category, description: description || undefined, date },
      {
        onSuccess: () => {
          setAmount('');
          setDescription('');
          setDate('');
          showToast('Expense added.');
        },
        onError: () => showToast("Couldn't add expense — try again.", 'error'),
      },
    );
  }

  function handleUpdate(
    id: string,
    dto: { amount: number; category: string; description?: string; date: string },
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

  function handleDelete(id: string, amount: number) {
    if (!window.confirm(`Delete this expense of $${amount.toFixed(2)}?`)) return;
    deleteExpense.mutate(id, {
      onSuccess: () => showToast('Expense deleted.'),
      onError: () => showToast("Couldn't delete expense — try again.", 'error'),
    });
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-ink">Expenses</h2>
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
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Category"
          className={inputClass}
        >
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
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
          disabled={createExpense.isPending}
          className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-border/30 disabled:opacity-60"
        >
          Add expense
        </button>
      </form>

      {isLoading && <ListSkeleton rows={2} />}
      {isError && <ErrorState message="Couldn't load expenses." onRetry={refetch} />}
      {!isLoading && !isError && (
        <ul className="divide-y divide-border rounded-lg border border-border bg-paper-raised">
          {expenses?.length === 0 && (
            <li className="px-4 py-4 text-center text-sm text-ink-muted">No expenses logged yet.</li>
          )}
          {expenses?.map((e) => (
            <ExpenseRow key={e.id} expense={e} onUpdate={handleUpdate} onDelete={handleDelete} />
          ))}
        </ul>
      )}
    </div>
  );
}
