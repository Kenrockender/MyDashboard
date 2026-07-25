export function MeterRow({
  label,
  value,
  share,
  tone = 'accent',
}: {
  label: string;
  value: string;
  /** 0–1, the row's share of the total. */
  share: number;
  tone?: 'accent' | 'negative';
}) {
  const pct = Math.max(0, Math.min(1, share));
  return (
    <div className="border-t border-hair py-3 first:border-t-0">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-sm capitalize text-ink">{label.replace(/_/g, ' ')}</span>
        <span className="font-tabular font-mono text-sm text-ink">
          {value}{' '}
          <span className="text-xs text-ink-muted">{(pct * 100).toFixed(0)}%</span>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full border border-hair bg-paper">
        <div
          className={`h-full rounded-full ${tone === 'accent' ? 'bg-accent' : 'bg-negative'}`}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
    </div>
  );
}
