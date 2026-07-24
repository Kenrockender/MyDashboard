import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="font-display text-lg italic text-ink">Ledger</span>
      <h1 className="font-display text-4xl italic text-ink">Page not found</h1>
      <p className="max-w-sm text-sm text-ink-muted">
        The page you&rsquo;re looking for doesn&rsquo;t exist or may have been moved.
      </p>
      <Link
        href="/dashboard"
        className="rounded-md border border-border bg-paper-raised px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-border/30"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
