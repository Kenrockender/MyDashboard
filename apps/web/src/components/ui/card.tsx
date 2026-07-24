import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border border-border bg-paper-raised ${padded ? "p-4" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
