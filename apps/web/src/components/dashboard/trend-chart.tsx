'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { MonthlyTrendEntry } from '@/hooks/use-dashboard';

export function TrendChart({ data }: { data: MonthlyTrendEntry[] }) {
  return (
    <div className="border rounded p-4 h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="revenue" stroke="#2563eb" />
          <Line type="monotone" dataKey="expenses" stroke="#dc2626" />
          <Line type="monotone" dataKey="profit" stroke="#16a34a" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
