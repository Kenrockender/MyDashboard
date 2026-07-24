const TONES = {
  positive: "bg-accent-soft text-accent",
  negative: "bg-negative-soft text-negative",
  neutral: "bg-border/60 text-ink-muted",
} as const;

const STATUS_TONE: Record<string, keyof typeof TONES> = {
  active: "positive",
  completed: "neutral",
  paid: "positive",
  pending: "negative",
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
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${TONES[resolved]}`}
    >
      {children}
    </span>
  );
}
