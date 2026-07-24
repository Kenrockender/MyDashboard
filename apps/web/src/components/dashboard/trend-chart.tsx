'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { MonthlyTrendEntry } from '@/hooks/use-dashboard';
import { Card } from '@/components/ui/card';

export function TrendChart({ data }: { data: MonthlyTrendEntry[] }) {
  return (
    <Card className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="month" stroke="var(--ink-muted)" fontSize={12} />
          <YAxis stroke="var(--ink-muted)" fontSize={12} />
          <Tooltip
            contentStyle={{
              background: 'var(--paper-raised)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 13,
            }}
          />
          <Legend />
          <Line type="monotone" dataKey="revenue" stroke="var(--ink)" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="expenses" stroke="var(--negative)" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="profit" stroke="var(--accent)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
