export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-border/60 ${className}`} />;
}

export function CardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-lg border border-border bg-paper-raised p-4 ${className}`}>
      <Skeleton className="h-3 w-16" />
      <Skeleton className="mt-2 h-6 w-24" />
    </div>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="divide-y divide-border rounded-lg border border-border bg-paper-raised">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 px-4 py-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
