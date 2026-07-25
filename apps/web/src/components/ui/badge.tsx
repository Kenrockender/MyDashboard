const TONES = {
  positive: "bg-accent-soft text-accent",
  negative: "bg-negative-soft text-negative",
  neutral: "bg-border/60 text-ink-muted",
} as const;

const STATUS_TONE: Record<string, keyof typeof TONES> = {
  active: "positive",
  completed: "neutral",
  on_hold: "neutral",
  paid: "positive",
  pending: "negative",
  overdue: "negative",
};

export function Badge({
  children,
  tone,
}: {
  children: string;
  tone?: keyof typeof TONES;
}) {
  const resolved = tone ?? STATUS_TONE[children.toLowerCase()] ?? "neutral";
  return (
    <span
      className={`inline-flex items-center rounded-[5px] px-2 py-[3px] font-mono text-[9.5px] uppercase tracking-[0.08em] ${TONES[resolved]}`}
    >
      {children.replace(/_/g, " ")}
    </span>
  );
}
