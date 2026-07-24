'use client';
import { useState } from 'react';
import { useExpenses, useCreateExpense, useDeleteExpense } from '@/hooks/use-expenses';

const EXPENSE_CATEGORIES = [
  'hosting',
  'domain',
  'api_usage',
  'software_subscription',
  'freelancer',
  'marketing',
  'miscellaneous',
];

export function ExpenseList({ projectId }: { projectId: string }) {
  const { data: expenses, isLoading } = useExpenses(projectId);
  const createExpense = useCreateExpense(projectId);
  const deleteExpense = useDeleteExpense(projectId);

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !date) return;
    createExpense.mutate(
      { amount: Number(amount), category, description: description || undefined, date },
      { onSuccess: () => { setAmount(''); setDescription(''); setDate(''); } },
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Expenses</h2>
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-2">
        <input
          type="number"
          step="0.01"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="border rounded px-2 py-1 w-28"
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="border rounded px-2 py-1">
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border rounded px-2 py-1"
        />
        <input
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border rounded px-2 py-1 flex-1 min-w-[8rem]"
        />
        <button type="submit" disabled={createExpense.isPending} className="border rounded px-3 py-1">
          Add expense
        </button>
      </form>

      {isLoading && <p>Loading...</p>}
      <ul className="space-y-1">
        {expenses?.map((e) => (
          <li key={e.id} className="border rounded p-2 flex items-center justify-between">
            <span>${Number(e.amount).toFixed(2)} — {e.category} — {e.date.slice(0, 10)}</span>
            <button onClick={() => deleteExpense.mutate(e.id)} className="text-sm text-red-600">
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
