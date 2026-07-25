import type { ReactNode } from 'react';

/** A form control under a mono, wide-tracked caption — the ledger's field style. */
export function Field({
  label,
  children,
  className = '',
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-ink-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

/** The bordered panel that holds an add/edit form. */
export function FormPanel({
  title,
  children,
  onSubmit,
}: {
  title: string;
  children: ReactNode;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[14px] border border-border bg-paper-raised p-5"
    >
      <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
        {title}
      </div>
      {children}
    </form>
  );
}
