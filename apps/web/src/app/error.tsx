'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="font-display text-lg italic text-ink">Ledger</span>
      <h1 className="font-display text-4xl italic text-ink">Something went wrong</h1>
      <p className="max-w-sm text-sm text-ink-muted">
        An unexpected error occurred. You can try again, or head back to the dashboard.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-md border border-accent/30 bg-accent-soft px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent-soft/70"
        >
          Try again
        </button>
        <a
          href="/dashboard"
          className="rounded-md border border-border bg-paper-raised px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-border/30"
        >
          Back to dashboard
        </a>
      </div>
    </div>
  );
}
