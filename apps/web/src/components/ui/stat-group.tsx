const TONE_TEXT = {
  ink: 'text-ink',
  accent: 'text-accent',
  negative: 'text-negative',
} as const;

export type StatTone = keyof typeof TONE_TEXT;

export interface Stat {
  label: string;
  value: string | number;
  caption?: string;
  tone?: StatTone;
  /** Draws the accent rule across the top of the cell — reserved for the profit figure. */
  ruled?: boolean;
}

/**
 * `gap-px` over a hair-coloured background draws the dividing rules, so they stay
 * correct however the cells wrap.
 */
const GRID = 'grid gap-px overflow-hidden rounded-[14px] border border-border bg-hair';

const COLUMNS: Record<number, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-4',
  5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
};

/** The headline figures, sharing one bordered block rather than floating as separate cards. */
export function StatGroup({ stats }: { stats: Stat[] }) {
  return (
    <div className={`${GRID} ${COLUMNS[stats.length] ?? 'grid-cols-2 sm:grid-cols-4'}`}>
      {stats.map((stat) => (
        <Cell key={stat.label} stat={stat} size="lg" />
      ))}
    </div>
  );
}

/** Income / expenses / profit, at the smaller scale used inside a detail panel. */
export function StatRow({ stats }: { stats: Stat[] }) {
  return (
    <div className={`${GRID} grid-cols-3`}>
      {stats.map((stat) => (
        <Cell key={stat.label} stat={stat} size="sm" />
      ))}
    </div>
  );
}

function Cell({ stat, size }: { stat: Stat; size: 'lg' | 'sm' }) {
  const { label, value, caption, tone = 'ink', ruled } = stat;
  return (
    <div className={`relative bg-paper-raised ${size === 'lg' ? 'p-4 sm:p-5' : 'p-4'}`}>
      {ruled && <span className="absolute inset-x-0 top-0 h-0.5 bg-accent" />}
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
        {label}
      </div>
      <div
        className={`font-tabular font-mono tracking-[-0.02em] ${TONE_TEXT[tone]} ${
          size === 'lg' ? 'mt-3 text-2xl sm:text-[29px]' : 'mt-2 text-xl sm:text-2xl'
        }`}
      >
        {value}
      </div>
      {caption && <div className="mt-1.5 text-xs text-ink-muted">{caption}</div>}
    </div>
  );
}
