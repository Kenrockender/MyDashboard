'use client';
import { useState } from 'react';
import { useIncome, useCreateIncome, useUpdateIncome, useDeleteIncome, type Income } from '@/hooks/use-income';
import { Badge } from '@/components/ui/badge';
import { Button, LinkButton } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { CurrencySelect } from '@/components/ui/currency-select';
import { Select } from '@/components/ui/select';
import { ListSkeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { useToast } from '@/lib/toast-context';
import { inputClass, money, type Currency } from '@/lib/ui';

const INCOME_STATUSES = ['pending', 'paid', 'overdue'];

function IncomeRow({
  income,
  onUpdate,
  onDelete,
}: {
  income: Income;
  onUpdate: (
    id: string,
    dto: { amount: number; currency: Currency; description?: string; status: string; date: string },
    onDone: () => void,
  ) => void;
  onDelete: (id: string, amount: number, currency: Currency) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(String(income.amount));
  const [currency, setCurrency] = useState<Currency>(income.currency);
  const [description, setDescription] = useState(income.description ?? '');
  const [status, setStatus] = useState(income.status);
  const [date, setDate] = useState(income.date.slice(0, 10));

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !date) return;
    onUpdate(
      income.id,
      { amount: Number(amount), currency, description: description || undefined, status, date },
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
          <Field label="Status">
            <Select
              value={status}
              onChange={setStatus}
              options={INCOME_STATUSES.map((value) => ({ value, label: value }))}
            />
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
        <div className="truncate text-sm text-ink">{income.description || 'Income'}</div>
        <div className="mt-0.5 text-xs text-ink-muted">{income.date.slice(0, 10)}</div>
      </div>
      <div className="flex flex-none items-center gap-4">
        <div className="text-right">
          <div className="font-tabular font-mono text-sm text-ink">
            {money(Number(income.amount), income.currency)}
          </div>
          <Badge>{income.status}</Badge>
        </div>
        <div className="flex gap-3 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
          <LinkButton onClick={() => setEditing(true)}>Edit</LinkButton>
          <LinkButton
            tone="negative"
            onClick={() => onDelete(income.id, Number(income.amount), income.currency)}
            aria-label={`Delete income of ${money(Number(income.amount), income.currency)}`}
          >
            Delete
          </LinkButton>
        </div>
      </div>
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
  const [currency, setCurrency] = useState<Currency>('USD');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState(INCOME_STATUSES[0]);
  const [date, setDate] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !date) return;
    createIncome.mutate(
      { amount: Number(amount), currency, description: description || undefined, status, date },
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

  function handleUpdate(
    id: string,
    dto: { amount: number; currency: Currency; description?: string; status: string; date: string },
    onDone: () => void,
  ) {
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

  function handleDelete(id: string, amount: number, currency: Currency) {
    if (!window.confirm(`Delete this income of ${money(amount, currency)}?`)) return;
    deleteIncome.mutate(id, {
      onSuccess: () => showToast('Income deleted.'),
      onError: () => showToast("Couldn't delete income — try again.", 'error'),
    });
  }

  return (
    <div className="overflow-hidden rounded-[14px] border border-border bg-paper-raised">
      <div className="px-5 pb-3 pt-4">
        <h2 className="font-display text-lg italic text-ink sm:text-xl">Income</h2>
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
        <Field label="Date">
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Description">
          <input
            placeholder="What was invoiced"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Button type="submit" disabled={createIncome.isPending} className="justify-self-start">
          Add income
        </Button>
      </form>

      {isLoading && <ListSkeleton rows={2} />}
      {isError && (
        <div className="px-5 py-4">
          <ErrorState message="Couldn't load income." onRetry={refetch} />
        </div>
      )}
      {!isLoading && !isError && (
        <ul className="m-0 list-none p-0">
          {income?.length === 0 && (
            <li className="border-t border-hair px-5 py-5 text-center text-sm text-ink-muted">
              No income logged yet.
            </li>
          )}
          {income?.map((i) => (
            <IncomeRow key={i.id} income={i} onUpdate={handleUpdate} onDelete={handleDelete} />
          ))}
        </ul>
      )}
    </div>
  );
}
