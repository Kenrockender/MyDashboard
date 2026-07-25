import type { ReactNode } from 'react';

export function SectionHeading({
  children,
  aside,
  className = '',
}: {
  children: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 ${className}`}>
      <h2 className="font-display text-lg italic text-ink sm:text-xl">{children}</h2>
      {aside}
    </div>
  );
}
