'use client';
import { use, useState } from 'react';
import Link from 'next/link';
import { useInvoice } from '@/hooks/use-invoices';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { LinkButton } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { useToast } from '@/lib/toast-context';
import { apiClient } from '@/lib/api-client';
import { downloadBlob, money } from '@/lib/ui';

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-hair py-2.5 first:border-t-0">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
        {label}
      </span>
      <span className="text-right text-sm text-ink">{value}</span>
    </div>
  );
}

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading, isError, refetch } = useInvoice(id);
  const { showToast } = useToast();
  const [downloading, setDownloading] = useState(false);

  const backLink = (
    <Link
      href="/invoices"
      className="mb-1 inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
    >
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" aria-hidden="true">
        <path
          d="M15 6l-6 6 6 6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Invoices
    </Link>
  );

  if (isError) {
    return (
      <div>
        {backLink}
        <ErrorState message="Couldn't load this invoice." onRetry={refetch} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {backLink}
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-40 rounded-[14px]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        {backLink}
        <p className="text-sm text-ink-muted">Invoice not found.</p>
      </div>
    );
  }

  const { invoice, project, client, incomeLines } = data;

  async function handleDownload() {
    setDownloading(true);
    try {
      const blob = await apiClient.getBlob(`/invoices/${id}/pdf`);
      downloadBlob(blob, `${invoice.invoiceNumber}.pdf`);
    } catch {
      showToast("Couldn't download the invoice PDF — try again.", 'error');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-6">
      {backLink}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-[28px] italic leading-[1.05] tracking-[-0.01em] text-ink sm:text-[33px]">
              {invoice.invoiceNumber}
            </h1>
            <Badge>{invoice.status}</Badge>
          </div>
          <p className="mt-1.5 text-sm text-ink-muted">
            {client?.name ?? 'No client'} ·{' '}
            <Link href={`/projects/${project.id}`} className="hover:text-ink hover:underline">
              {project.name}
            </Link>
          </p>
        </div>
        <LinkButton onClick={handleDownload} disabled={downloading}>
          {downloading ? 'Downloading…' : 'Download PDF'}
        </LinkButton>
      </div>

      <Card>
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
            Amount due
          </span>
          <span className="font-tabular font-mono text-2xl text-ink sm:text-[29px]">
            {money(invoice.subtotal, invoice.currency)}
          </span>
        </div>
        <Row label="Issued" value={invoice.issueDate.slice(0, 10)} />
        <Row label="Due" value={invoice.dueDate ? invoice.dueDate.slice(0, 10) : '—'} />
        <Row label="Sent" value={invoice.sentAt ? invoice.sentAt.slice(0, 10) : 'Not sent yet'} />
        <Row label="Paid" value={invoice.paidAt ? invoice.paidAt.slice(0, 10) : 'Not paid yet'} />
        {client?.email && <Row label="Client email" value={client.email} />}
        {invoice.notes && <Row label="Notes" value={invoice.notes} />}
      </Card>

      <div className="overflow-hidden rounded-[14px] border border-border bg-paper-raised">
        <div className="px-5 pb-3 pt-4">
          <h2 className="font-display text-lg italic text-ink sm:text-xl">Covered income</h2>
        </div>
        <ul className="m-0 list-none p-0">
          {incomeLines.length === 0 && (
            <li className="border-t border-hair px-5 py-5 text-center text-sm text-ink-muted">
              The income records this invoice covered have since been deleted.
            </li>
          )}
          {incomeLines.map((line) => (
            <li
              key={line.id}
              className="flex items-center justify-between gap-3 border-t border-hair px-5 py-3"
            >
              <div className="min-w-0">
                <div className="truncate text-sm text-ink">{line.description || 'Income'}</div>
                <div className="mt-0.5 text-xs text-ink-muted">{line.date.slice(0, 10)}</div>
              </div>
              <span className="font-tabular font-mono text-sm text-ink">
                {money(line.amount, line.currency)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
