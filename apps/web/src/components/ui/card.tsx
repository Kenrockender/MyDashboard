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
      className={`rounded-[14px] border border-border bg-paper-raised ${padded ? "p-5" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
