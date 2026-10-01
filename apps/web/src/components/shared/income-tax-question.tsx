'use client';

import { useSettings, useUpdateSettings, type IncomeType } from '@/hooks/use-settings';
import { useToast } from '@/lib/toast-context';

const OPTIONS: { value: IncomeType; label: string }[] = [
  {
    value: 'business',
    label: 'Business income (selling goods or non-professional services)',
  },
  {
    value: 'professional',
    label: 'Independent professional services (pekerjaan bebas), including content creation',
  },
];

/**
 * The single "How is your income taxed?" question. It decides whether the
 * PPh Final UMKM (0.5%) figure applies at all — business income qualifies,
 * pekerjaan bebas (independent professional services, and since PP 20/2026
 * content creators by name) does not and is taxed at progressive rates under
 * PPh Pasal 17. Rendered on the Settings page and reused inline on Reports
 * when the question is still unanswered.
 */
export function IncomeTaxQuestion({ className = '' }: { className?: string }) {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const { showToast } = useToast();

  const current = settings?.incomeType;

  function choose(value: IncomeType) {
    if (value === current || updateSettings.isPending) return;
    updateSettings.mutate(
      { incomeType: value },
      {
        onError: () => showToast("Couldn't save that — try again.", 'error'),
      },
    );
  }

  return (
    <fieldset className={`min-w-0 ${className}`} disabled={isLoading || updateSettings.isPending}>
      <legend className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
        How is your income taxed?
      </legend>
      <div className="mt-3 flex flex-col gap-2.5">
        {OPTIONS.map((option) => {
          const selected = current === option.value;
          return (
            <label
              key={option.value}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 text-sm transition ${
                selected
                  ? 'border-accent bg-accent-soft text-ink'
                  : 'border-border bg-paper text-ink hover:border-ink-muted'
              }`}
            >
              <input
                type="radio"
                name="incomeType"
                value={option.value}
                checked={selected}
                onChange={() => choose(option.value)}
                className="mt-0.5 h-4 w-4 flex-none accent-accent"
              />
              <span className="leading-relaxed">{option.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
