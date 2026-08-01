'use client';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { MonthlyTrendEntry } from '@/hooks/use-dashboard';
import { Card } from '@/components/ui/card';
import { moneyRounded, type Currency } from '@/lib/ui';

const SERIES = [
  { key: 'revenue', label: 'Revenue', color: 'var(--ink)', width: 2 },
  { key: 'expenses', label: 'Expenses', color: 'var(--negative)', width: 2 },
  { key: 'profit', label: 'Profit', color: 'var(--accent)', width: 2.25 },
] as const;

const TICK = { fill: 'var(--ink-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' };

const LOCALE: Record<Currency, string> = { USD: 'en-US', IDR: 'id-ID' };

/** Full `moneyRounded` figures (e.g. "Rp15.000.000") don't fit in the axis's
 *  fixed width, especially for IDR — compact notation keeps ticks short
 *  ("Rp15Jt") while the tooltip keeps full precision on hover. */
const COMPACT_MONEY: Record<Currency, Intl.NumberFormat> = {
  USD: new Intl.NumberFormat(LOCALE.USD, {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }),
  IDR: new Intl.NumberFormat(LOCALE.IDR, {
    style: 'currency',
    currency: 'IDR',
    notation: 'compact',
    maximumFractionDigits: 1,
  }),
};

function compactMoney(value: number, currency: Currency) {
  return COMPACT_MONEY[currency].format(value);
}

/** A single currency's trend — the amounts in `data` must all be in `currency`. */
export function TrendChart({
  data,
  currency,
  showCurrencyTag = false,
}: {
  data: MonthlyTrendEntry[];
  currency: Currency;
  showCurrencyTag?: boolean;
}) {
  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-baseline gap-2 font-display text-lg italic text-ink sm:text-xl">
          Monthly trend
          {showCurrencyTag && (
            <span className="font-mono text-[11px] not-italic uppercase tracking-[0.1em] text-ink-muted">
              {currency}
            </span>
          )}
        </h2>
        <div className="flex gap-4 text-[11.5px] text-ink-muted">
          {SERIES.map((s) => (
            <span key={s.key} className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-0.5 w-3.5"
                style={{ background: s.color }}
              />
              {s.label}
            </span>
          ))}
        </div>
      </div>
      <div className="h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          {/* No negative left margin: it pulls the Y axis outside the plot area
              and clips the start of each label ("Rp 160 jt" losing its "R"). */}
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="var(--hair)" vertical={false} />
            <XAxis
              dataKey="month"
              tick={TICK}
              tickLine={false}
              axisLine={{ stroke: 'var(--hair)' }}
            />
            <YAxis
              tick={TICK}
              tickLine={false}
              axisLine={false}
              // IDR labels ("Rp 160 jt") run several characters longer than
              // USD's ("$13.5K"), so the gutter is sized per currency rather
              // than padding every chart out to the widest case.
              width={currency === 'IDR' ? 78 : 58}
              tickFormatter={(value: number) => compactMoney(value, currency)}
            />
            <Tooltip
              formatter={(value, name) => [moneyRounded(Number(value), currency), name]}
              contentStyle={{
                background: 'var(--paper-raised)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                fontSize: 13,
              }}
              labelStyle={{ color: 'var(--ink-muted)' }}
            />
            {SERIES.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={s.width}
                dot={false}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
