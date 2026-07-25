'use client';
import { useState } from 'react';
import { useIncome, useCreateIncome, useUpdateIncome } from '@/hooks/use-income';
import {
  useExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
} from '@/hooks/use-expenses';
import { Button, LinkButton } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { CurrencySelect } from '@/components/ui/currency-select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/lib/toast-context';
import { inputClass, money, type Currency } from '@/lib/ui';

/**
 * The read-only-by-default summary shown for a one-time-sale project instead
 * of the ongoing IncomeList/ExpenseList — a single sale, not a running ledger.
 */
export function SaleSummary({ projectId }: { projectId: string }) {
  const { data: income, isLoading: incomeLoading } = useIncome(projectId);
  const { data: expenses, isLoading: expensesLoading } = useExpenses(projectId);
  const createIncome = useCreateIncome(projectId);
  const updateIncome = useUpdateIncome(projectId);
  const createExpense = useCreateExpense(projectId);
  const updateExpense = useUpdateExpense(projectId);
  const deleteExpense = useDeleteExpense(projectId);
  const { showToast } = useToast();

  const [editing, setEditing] = useState(false);
  const sale = income?.[0];
  const cost = expenses?.[0];

  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [date, setDate] = useState('');
  const [costAmount, setCostAmount] = useState('');

  function startEditing() {
    setAmount(sale ? String(sale.amount) : '');
    setCurrency(sale?.currency ?? 'USD');
    setDate((sale?.date ?? new Date().toISOString()).slice(0, 10));
    setCostAmount(cost ? String(cost.amount) : '');
    setEditing(true);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !date) return;

    const saveSale = sale
      ? updateIncome.mutateAsync({ id: sale.id, dto: { amount: Number(amount), currency, date } })
      : createIncome.mutateAsync({ amount: Number(amount), currency, status: 'paid', description: 'Sale', date });

    const saveCost = costAmount
      ? cost
        ? updateExpense.mutateAsync({ id: cost.id, dto: { amount: Number(costAmount), currency } })
        : createExpense.mutateAsync({
            amount: Number(costAmount),
            currency,
            category: 'miscellaneous',
            description: 'Cost of sale',
            date,
          })
      : cost
        ? deleteExpense.mutateAsync(cost.id)
        : Promise.resolve();

    Promise.all([saveSale, saveCost])
      .then(() => {
        setEditing(false);
        showToast('Sale updated.');
      })
      .catch(() => showToast("Couldn't update sale — try again.", 'error'));
  }

  if (incomeLoading || expensesLoading) {
    return <Skeleton className="h-24 rounded-[14px]" />;
  }

  if (editing) {
    return (
      <form
        onSubmit={handleSave}
        className="grid gap-3 rounded-[14px] border border-border bg-paper-raised p-5 sm:grid-cols-2"
      >
        <Field label="Sale amount">
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
        <Field label="Cost (optional)">
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={costAmount}
            onChange={(e) => setCostAmount(e.target.value)}
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
    );
  }

  return (
    <div className="overflow-hidden rounded-[14px] border border-border bg-paper-raised">
      <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-4">
        <h2 className="font-display text-lg italic text-ink sm:text-xl">Sale</h2>
        <LinkButton onClick={startEditing}>Edit sale</LinkButton>
      </div>
      <div className="border-t border-hair px-5 py-3.5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-ink">{sale?.description || 'Sale'}</span>
          <span className="font-tabular font-mono text-sm text-accent">
            {sale ? money(Number(sale.amount), sale.currency) : '—'}
          </span>
        </div>
        {sale && <div className="mt-0.5 text-xs text-ink-muted">{sale.date.slice(0, 10)}</div>}
      </div>
      {cost && (
        <div className="border-t border-hair px-5 py-3.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-ink">{cost.description || 'Cost'}</span>
            <span className="font-tabular font-mono text-sm text-negative">
              {money(Number(cost.amount), cost.currency)}
            </span>
          </div>
          <div className="mt-0.5 text-xs text-ink-muted">{cost.date.slice(0, 10)}</div>
        </div>
      )}
    </div>
  );
}
