'use client';
import { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import {
  useMonthlyReport,
  useProfitabilityReport,
  useExpenseReport,
  useRevenueReport,
} from '@/hooks/use-reports';

const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#d97706', '#7c3aed', '#0891b2', '#db2777'];

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export default function ReportsPage() {
  const [month, setMonth] = useState(currentMonth());
  const { data: monthly } = useMonthlyReport(month);
  const { data: profitability } = useProfitabilityReport();
  const { data: expenses } = useExpenseReport();
  const { data: revenue } = useRevenueReport();

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Monthly Summary</h2>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border rounded px-2 py-1"
        />
        {monthly && (
          <div className="grid grid-cols-3 gap-4">
            <div className="border rounded p-4">
              <p className="text-sm text-gray-500">Revenue</p>
              <p className="text-xl font-semibold">${monthly.revenue.toFixed(2)}</p>
            </div>
            <div className="border rounded p-4">
              <p className="text-sm text-gray-500">Expenses</p>
              <p className="text-xl font-semibold">${monthly.expenses.toFixed(2)}</p>
            </div>
            <div className="border rounded p-4">
              <p className="text-sm text-gray-500">Profit</p>
              <p className="text-xl font-semibold">${monthly.profit.toFixed(2)}</p>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Profitability by Project</h2>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b text-left">
              <th className="py-1">Project</th>
              <th className="py-1">Income</th>
              <th className="py-1">Expenses</th>
              <th className="py-1">Profit</th>
              <th className="py-1">Margin</th>
            </tr>
          </thead>
          <tbody>
            {profitability?.map((p) => (
              <tr key={p.projectId} className="border-b">
                <td className="py-1">{p.name}</td>
                <td className="py-1">${p.income.toFixed(2)}</td>
                <td className="py-1">${p.expenses.toFixed(2)}</td>
                <td className="py-1">${p.profit.toFixed(2)}</td>
                <td className="py-1">{(p.margin * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Expenses by Category</h2>
        {expenses && expenses.length > 0 ? (
          <div className="h-72 border rounded p-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={expenses} dataKey="total" nameKey="category" outerRadius={90} label>
                  {expenses.map((entry, i) => (
                    <Cell key={entry.category} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No expenses yet.</p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Revenue by Client</h2>
        <ul className="space-y-1">
          {revenue?.map((r) => (
            <li key={r.clientId ?? 'none'} className="border rounded p-2 flex items-center justify-between">
              <span>{r.clientName}</span>
              <span>${r.total.toFixed(2)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
