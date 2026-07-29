import { CURRENCIES, type Currency } from '@/lib/ui';
import { Field } from '@/components/ui/field';
import { Select } from '@/components/ui/select';

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
      <Select
        value={value}
        onChange={(v) => onChange(v as Currency)}
        options={CURRENCIES.map((c) => ({ value: c, label: c }))}
      />
    </Field>
  );
}
