'use client';
import { useState } from 'react';
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense, type Expense } from '@/hooks/use-expenses';
import { Button, LinkButton } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { ListSkeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { useToast } from '@/lib/toast-context';
import { inputClass, money } from '@/lib/ui';

const EXPENSE_CATEGORIES = [
  'hosting',
  'domain',
  'api_usage',
  'software_subscription',
  'freelancer',
  'marketing',
  'miscellaneous',
];

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
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputClass}
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </Field>
          <Field label="Description">
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
            />
          </Field>
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
    <li className="group flex items-center justify-between gap-3 border-t border-hair px-5 py-3">
      <div className="min-w-0">
        <div className="truncate text-sm text-ink">{expense.description || 'Expense'}</div>
        <div className="mt-0.5 text-xs capitalize text-ink-muted">
          {expense.category.replace(/_/g, ' ')} · {expense.date.slice(0, 10)}
        </div>
      </div>
      <div className="flex flex-none items-center gap-4">
        <span className="font-tabular font-mono text-sm text-negative">
          {money(Number(expense.amount))}
        </span>
        <div className="flex gap-3 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
          <LinkButton onClick={() => setEditing(true)}>Edit</LinkButton>
          <LinkButton
            tone="negative"
            onClick={() => onDelete(expense.id, Number(expense.amount))}
            aria-label={`Delete expense of ${money(Number(expense.amount))}`}
          >
            Delete
          </LinkButton>
        </div>
      </div>
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
    if (!window.confirm(`Delete this expense of ${money(amount)}?`)) return;
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
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </Field>
        <Field label="Description">
          <input
            placeholder="What it was for"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
          />
        </Field>
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
