'use client';
import { useState } from 'react';
import { useIncome, useCreateIncome, useDeleteIncome } from '@/hooks/use-income';

export function IncomeList({ projectId }: { projectId: string }) {
  const { data: income, isLoading } = useIncome(projectId);
  const createIncome = useCreateIncome(projectId);
  const deleteIncome = useDeleteIncome(projectId);

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !date) return;
    createIncome.mutate(
      { amount: Number(amount), description: description || undefined, date },
      { onSuccess: () => { setAmount(''); setDescription(''); setDate(''); } },
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Income</h2>
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-2">
        <input
          type="number"
          step="0.01"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="border rounded px-2 py-1 w-28"
        />
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
        <button type="submit" disabled={createIncome.isPending} className="border rounded px-3 py-1">
          Add income
        </button>
      </form>

      {isLoading && <p>Loading...</p>}
      <ul className="space-y-1">
        {income?.map((i) => (
          <li key={i.id} className="border rounded p-2 flex items-center justify-between">
            <span>${Number(i.amount).toFixed(2)} — {i.description || i.status} — {i.date.slice(0, 10)}</span>
            <button onClick={() => deleteIncome.mutate(i.id)} className="text-sm text-red-600">
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
