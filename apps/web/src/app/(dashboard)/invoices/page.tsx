'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useAllInvoices } from '@/hooks/use-invoices';
import { useClients } from '@/hooks/use-clients';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { SearchInput } from '@/components/ui/search-input';
import { ListSkeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { LoadMoreButton } from '@/components/ui/load-more-button';
import { money } from '@/lib/ui';

const STATUS_FILTERS = ['all', 'draft', 'sent', 'paid', 'overdue'] as const;

export default function InvoicesPage() {
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAllInvoices({
    status: status === 'all' ? undefined : status,
    search: debouncedSearch || undefined,
  });
  const { data: clients } = useClients();

  const clientsById = useMemo(
    () => new Map((clients ?? []).map((c) => [c.id, c.name])),
    [clients],
  );

  const invoices = data?.pages.flatMap((page) => page.items);

  return (
    <div className="space-y-6">
      <PageHeader title="Invoices" subtitle="Every invoice you've sent, across every project." />

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          label="Search invoices"
          placeholder="Search by invoice number or client"
          className="min-w-[14rem] flex-1"
        />
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-[9px] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] transition ${
                status === s
                  ? 'bg-accent text-accent-ink'
                  : 'border border-border bg-paper-raised text-ink-muted hover:text-ink'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <ListSkeleton />}
      {isError && <ErrorState message="Couldn't load invoices." onRetry={refetch} />}
      {!isLoading && !isError && (
        <div className="overflow-hidden rounded-[14px] border border-border bg-paper-raised">
          <ul className="m-0 list-none p-0">
            {invoices?.length === 0 && (
              <li className="px-5 py-6 text-center text-sm text-ink-muted">
                {debouncedSearch
                  ? 'No invoices match your search.'
                  : "No invoices yet — create one from a project's Income section."}
              </li>
            )}
            {invoices?.map((inv) => (
              <li key={inv.id} className="border-t border-hair px-5 py-3.5 first:border-t-0">
                <Link
                  href={`/projects/${inv.projectId}`}
                  className="flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-ink">
                      {inv.invoiceNumber}
                    </div>
                    <div className="mt-0.5 text-xs text-ink-muted">
                      {(inv.clientId && clientsById.get(inv.clientId)) || 'No client'} ·{' '}
                      {inv.issueDate.slice(0, 10)}
                      {inv.dueDate ? ` · due ${inv.dueDate.slice(0, 10)}` : ''}
                    </div>
                  </div>
                  <div className="flex flex-none items-center gap-4">
                    <span className="font-tabular font-mono text-sm text-ink">
                      {money(inv.subtotal, inv.currency)}
                    </span>
                    <Badge>{inv.status}</Badge>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          {hasNextPage && (
            <LoadMoreButton onClick={() => fetchNextPage()} loading={isFetchingNextPage} />
          )}
        </div>
      )}
    </div>
  );
}
