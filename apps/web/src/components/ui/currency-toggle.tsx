'use client';
import type { Currency } from '@/lib/ui';

/** Pill switcher for picking which currency's figures to show, used when the ledger holds more than one. */
export function CurrencyToggle({
  currencies,
  selected,
  onSelect,
}: {
  currencies: Currency[];
  selected: Currency;
  onSelect: (currency: Currency) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-border bg-paper-raised p-0.5">
      {currencies.map((currency) => (
        <button
          key={currency}
          onClick={() => onSelect(currency)}
          aria-pressed={currency === selected}
          className={`rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${
            currency === selected ? 'bg-accent text-accent-ink' : 'text-ink-muted hover:text-ink'
          }`}
        >
          {currency}
        </button>
      ))}
    </div>
  );
}
