import { CURRENCIES, type Currency } from '@/lib/ui';
import { Field } from '@/components/ui/field';
import { inputClass } from '@/lib/ui';

export function CurrencySelect({
  value,
  onChange,
  className,
}: {
  value: Currency;
  onChange: (value: Currency) => void;
  className?: string;
}) {
  return (
    <Field label="Currency" className={className}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Currency)}
        className={inputClass}
      >
        {CURRENCIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
    </Field>
  );
}
