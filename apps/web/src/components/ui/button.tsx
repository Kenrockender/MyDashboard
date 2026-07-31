import { forwardRef, type ButtonHTMLAttributes } from 'react';

const VARIANTS = {
  primary:
    'bg-accent text-accent-ink hover:brightness-110 disabled:hover:brightness-100',
  secondary:
    'border border-border bg-paper-raised text-ink hover:border-ink-muted',
  negative:
    'bg-negative text-paper hover:brightness-110 disabled:hover:brightness-100',
} as const;

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof VARIANTS }
>(function Button({ variant = 'primary', className = '', ...props }, ref) {
  return (
    <button
      ref={ref}
      {...props}
      className={`rounded-[9px] px-4 py-2 text-sm font-medium transition disabled:opacity-60 ${VARIANTS[variant]} ${className}`}
    />
  );
});

/** The quiet inline actions in list rows — edit, cancel, delete. */
export function LinkButton({
  tone = 'muted',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'muted' | 'accent' | 'negative' }) {
  const color =
    tone === 'accent'
      ? 'text-accent'
      : tone === 'negative'
        ? 'text-negative'
        : 'text-ink-muted hover:text-ink';
  return (
    <button
      {...props}
      className={`text-sm font-medium transition hover:underline underline-offset-4 disabled:opacity-60 ${color} ${className}`}
    />
  );
}
