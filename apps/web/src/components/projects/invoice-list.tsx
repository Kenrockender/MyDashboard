'use client';
import { useMemo, useState } from 'react';
import {
  useInvoices,
  useCreateInvoice,
  useUpdateInvoiceStatus,
  useSendInvoice,
  useDeleteInvoice,
  type Invoice,
} from '@/hooks/use-invoices';
import { useIncome } from '@/hooks/use-income';
import { useClients } from '@/hooks/use-clients';
import { Badge } from '@/components/ui/badge';
import { Button, LinkButton } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { ListSkeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { useToast } from '@/lib/toast-context';
import { apiClient } from '@/lib/api-client';
import { downloadBlob, inputClass, money } from '@/lib/ui';

function InvoiceRow({
  invoice,
  onDownload,
  onSend,
  onMarkPaid,
  onDelete,
}: {
  invoice: Invoice;
  onDownload: (invoice: Invoice) => Promise<void>;
  onSend: (invoice: Invoice) => void;
  onMarkPaid: (invoice: Invoice) => void;
  onDelete: (invoice: Invoice) => void;
}) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      await onDownload(invoice);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <li className="group flex items-center justify-between gap-3 border-t border-hair px-5 py-3">
      <div className="min-w-0">
        <div className="truncate text-sm text-ink">{invoice.invoiceNumber}</div>
        <div className="mt-0.5 text-xs text-ink-muted">
          {invoice.issueDate.slice(0, 10)}
          {invoice.dueDate ? ` · due ${invoice.dueDate.slice(0, 10)}` : ''}
        </div>
      </div>
      <div className="flex flex-none items-center gap-4">
        <div className="text-right">
          <div className="font-tabular font-mono text-sm text-ink">
            {money(invoice.subtotal, invoice.currency)}
          </div>
          <Badge>{invoice.status}</Badge>
        </div>
        <div className="flex gap-3 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
          <LinkButton onClick={handleDownload} disabled={downloading}>
            {downloading ? 'Downloading…' : 'Download PDF'}
          </LinkButton>
          {invoice.status === 'draft' && (
            <LinkButton tone="accent" onClick={() => onSend(invoice)}>
              Send
            </LinkButton>
          )}
          {(invoice.status === 'sent' || invoice.status === 'overdue') && (
            <LinkButton tone="accent" onClick={() => onMarkPaid(invoice)}>
              Mark paid
            </LinkButton>
          )}
          {invoice.status === 'draft' && (
            <LinkButton
              tone="negative"
              onClick={() => onDelete(invoice)}
              aria-label={`Delete draft invoice ${invoice.invoiceNumber}`}
            >
              Delete
            </LinkButton>
          )}
        </div>
      </div>
    </li>
  );
}

export function InvoiceList({ projectId }: { projectId: string }) {
  const { data: invoices, isLoading, isError, refetch } = useInvoices(projectId);
  const { data: income } = useIncome(projectId);
  const { data: clients } = useClients();
  const createInvoice = useCreateInvoice(projectId);
  const updateInvoice = useUpdateInvoiceStatus(projectId);
  const sendInvoice = useSendInvoice(projectId);
  const deleteInvoice = useDeleteInvoice(projectId);
  const { showToast } = useToast();

  const [selected, setSelected] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');

  // Income already covered by an existing invoice shouldn't be offered again.
  const alreadyInvoiced = useMemo(
    () => new Set(invoices?.flatMap((inv) => inv.incomeIds) ?? []),
    [invoices],
  );
  const invoiceableIncome = income?.filter((i) => !alreadyInvoiced.has(i.id)) ?? [];
  // An invoice can't mix currencies (Ledger never converts between them) — once
  // one currency is selected, income in any other currency is disabled.
  const selectedCurrency = invoiceableIncome.find((i) => selected.includes(i.id))?.currency;

  function toggleSelected(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selected.length === 0) return;
    createInvoice.mutate(
      { incomeIds: selected, dueDate: dueDate || undefined },
      {
        onSuccess: () => {
          setSelected([]);
          setDueDate('');
          showToast('Invoice created.');
        },
        onError: () =>
          showToast(
            "Couldn't create invoice — check that the selected income all uses the same currency.",
            'error',
          ),
      },
    );
  }

  async function handleDownload(invoice: Invoice) {
    try {
      const blob = await apiClient.getBlob(`/invoices/${invoice.id}/pdf`);
      downloadBlob(blob, `${invoice.invoiceNumber}.pdf`);
    } catch {
      showToast("Couldn't download the invoice PDF — try again.", 'error');
    }
  }

  async function handleSend(invoice: Invoice) {
    // Browsers can't pre-attach a file to a mailto: link — that's a platform
    // limitation, not a gap here. Downloading first is the workaround: the
    // PDF lands in the user's downloads folder and they attach it manually.
    try {
      const blob = await apiClient.getBlob(`/invoices/${invoice.id}/pdf`);
      downloadBlob(blob, `${invoice.invoiceNumber}.pdf`);
    } catch {
      showToast("Couldn't download the invoice PDF — try again.", 'error');
      return;
    }

    sendInvoice.mutate(invoice.id, {
      onSuccess: () => {
        const email = clients?.find((c) => c.id === invoice.clientId)?.email;
        const subject = encodeURIComponent(`Invoice ${invoice.invoiceNumber}`);
        const body = encodeURIComponent(
          `Hi,\n\nPlease find attached invoice ${invoice.invoiceNumber} for ${money(
            invoice.subtotal,
            invoice.currency,
          )}.\n\nThanks!`,
        );
        window.open(`mailto:${email ?? ''}?subject=${subject}&body=${body}`, '_blank');
        showToast('Invoice marked sent — attach the downloaded PDF to the email that just opened.');
      },
      onError: () => showToast("Couldn't mark invoice as sent — try again.", 'error'),
    });
  }

  function handleMarkPaid(invoice: Invoice) {
    updateInvoice.mutate(
      { id: invoice.id, dto: { status: 'paid' } },
      {
        onSuccess: () => showToast('Invoice marked paid.'),
        onError: () => showToast("Couldn't update invoice — try again.", 'error'),
      },
    );
  }

  function handleDelete(invoice: Invoice) {
    if (!window.confirm(`Delete draft invoice ${invoice.invoiceNumber}?`)) return;
    deleteInvoice.mutate(invoice.id, {
      onSuccess: () => showToast('Invoice deleted.'),
      onError: () => showToast("Couldn't delete invoice — try again.", 'error'),
    });
  }

  return (
    <div className="overflow-hidden rounded-[14px] border border-border bg-paper-raised">
      <div className="px-5 pb-3 pt-4">
        <h2 className="font-display text-lg italic text-ink sm:text-xl">Invoices</h2>
      </div>

      <form onSubmit={handleSubmit} className="border-t border-hair px-5 py-4">
        {invoiceableIncome.length === 0 ? (
          <p className="text-sm text-ink-muted">
            No unbilled income to invoice yet — add income above, or every entry is already on an
            invoice.
          </p>
        ) : (
          <>
            <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-ink-muted">
              Cover which income?
            </span>
            <ul className="m-0 mt-2 list-none space-y-1.5 p-0">
              {invoiceableIncome.map((i) => {
                const disabled =
                  !!selectedCurrency && i.currency !== selectedCurrency && !selected.includes(i.id);
                return (
                  <li
                    key={i.id}
                    className={`flex items-center gap-2 text-sm ${disabled ? 'text-ink-muted/50' : 'text-ink'}`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(i.id)}
                      onChange={() => toggleSelected(i.id)}
                      disabled={disabled}
                      className="h-4 w-4 rounded border-border disabled:cursor-not-allowed"
                    />
                    <span className="min-w-0 flex-1 truncate">{i.description || 'Income'}</span>
                    <span className="font-mono text-xs text-ink-muted">
                      {money(i.amount, i.currency)}
                    </span>
                  </li>
                );
              })}
            </ul>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <Field label="Due date (optional)">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Button type="submit" disabled={selected.length === 0 || createInvoice.isPending}>
                Create invoice
              </Button>
            </div>
          </>
        )}
      </form>

      {isLoading && <ListSkeleton rows={2} />}
      {isError && (
        <div className="px-5 py-4">
          <ErrorState message="Couldn't load invoices." onRetry={refetch} />
        </div>
      )}
      {!isLoading && !isError && (
        <ul className="m-0 list-none p-0">
          {invoices?.length === 0 && (
            <li className="border-t border-hair px-5 py-5 text-center text-sm text-ink-muted">
              No invoices yet.
            </li>
          )}
          {invoices?.map((inv) => (
            <InvoiceRow
              key={inv.id}
              invoice={inv}
              onDownload={handleDownload}
              onSend={handleSend}
              onMarkPaid={handleMarkPaid}
              onDelete={handleDelete}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
