import { Card } from "@/components/ui/card";

const TONE_BAR = {
  accent: "bg-accent",
  negative: "bg-negative",
  neutral: "bg-border",
} as const;

export function KpiCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  tone?: keyof typeof TONE_BAR;
}) {
  return (
    <Card className="relative overflow-hidden pl-5">
      <span className={`absolute inset-y-0 left-0 w-1 ${TONE_BAR[tone]}`} />
      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
        {label}
      </p>
      <p className="mt-1 font-tabular font-mono text-2xl text-ink">{value}</p>
    </Card>
  );
}
