export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-border/60 ${className}`} />;
}

export function StatGroupSkeleton({ cells = 4 }: { cells?: number }) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[14px] border border-border bg-hair sm:grid-cols-4">
      {Array.from({ length: cells }).map((_, i) => (
        <div key={i} className="bg-paper-raised p-4 sm:p-5">
          <Skeleton className="h-2.5 w-20" />
          <Skeleton className="mt-3 h-7 w-28" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-[14px] border border-border bg-paper-raised p-5 ${className}`}>
      <Skeleton className="h-3 w-16" />
      <Skeleton className="mt-2 h-6 w-24" />
    </div>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="divide-y divide-hair rounded-[14px] border border-border bg-paper-raised">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 px-5 py-3.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
