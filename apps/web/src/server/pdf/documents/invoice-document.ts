// No JSX here on purpose: adding a `.tsx`/JSX pipeline for these documents
// would touch build config (tsconfig "jsx", Jest transform for .tsx) shared by
// the whole server for the sake of one feature. Plain React.createElement calls
// give @react-pdf/renderer the same element tree without any of that.
import { createElement } from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { ReactElement } from 'react';
import { formatMoney } from '../format-money';
import { COLORS, pdfStyles, toDateString } from '../theme';
import type { Invoice } from '../../invoices/invoices.service';
import type { Project } from '../../projects/projects.service';
import type { Client } from '../../clients/clients.service';
import type { Income } from '../../income/income.service';

const STATUS_COLORS: Record<Invoice['status'], string> = {
  draft: COLORS.inkMuted,
  sent: COLORS.accent,
  paid: COLORS.accent,
  overdue: COLORS.negative,
};

const styles = StyleSheet.create({
  partiesRow: { flexDirection: 'row', gap: 32, marginTop: 24, marginBottom: 26 },
  party: { flex: 1 },
  partyName: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: COLORS.ink },
  partyLine: { fontSize: 9.5, color: COLORS.inkMuted, marginTop: 2 },

  statusPill: {
    alignSelf: 'flex-end',
    marginTop: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 3,
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  cellDesc: { flex: 3 },
  cellDate: { flex: 1.1 },
  cellAmount: { flex: 1.3, textAlign: 'right' },

  // The total sits in its own tinted block rather than as one more table row,
  // so the figure that matters is the first thing the eye lands on.
  totalBlock: {
    marginTop: 18,
    marginLeft: 'auto',
    width: 220,
    backgroundColor: COLORS.accentSoft,
    borderRadius: 4,
    padding: 14,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  totalLabel: {
    fontSize: 7.5,
    color: COLORS.accent,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  totalValue: { fontSize: 17, fontFamily: 'Helvetica-Bold', color: COLORS.ink },

  notes: {
    marginTop: 26,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  notesBody: { fontSize: 9.5, color: COLORS.inkMuted, lineHeight: 1.5 },
});

/**
 * Builds the `<Document>` element for one invoice. Never sums or converts
 * between currencies — every figure on the page is in `invoice.currency`,
 * the single currency the invoice was created with.
 *
 * Return type is `ReactElement<any>` because `@react-pdf/renderer`'s
 * `DocumentProps` isn't a named export (it lives inside the package's
 * `ReactPDF` namespace) — deliberate interop, not a general escape hatch.
 */
export function buildInvoiceDocument({
  invoice,
  project,
  client,
  incomeLines,
}: {
  invoice: Invoice;
  project: Project;
  client: Client | null;
  incomeLines: Income[];
}): ReactElement<any> {
  return createElement(
    Document,
    { title: invoice.invoiceNumber, author: 'Ledger' },
    createElement(
      Page,
      { size: 'A4', style: pdfStyles.page },

      // --- Masthead ---------------------------------------------------------
      createElement(
        View,
        { style: pdfStyles.masthead },
        createElement(
          View,
          {},
          createElement(Text, { style: pdfStyles.brand }, 'Ledger'),
          createElement(Text, { style: pdfStyles.brandTag }, 'PROJECT FINANCE'),
        ),
        createElement(
          View,
          {},
          createElement(Text, { style: pdfStyles.docTitle }, 'Invoice'),
          createElement(Text, { style: pdfStyles.docMeta }, invoice.invoiceNumber),
          createElement(
            Text,
            {
              style: [
                styles.statusPill,
                { color: STATUS_COLORS[invoice.status], borderColor: STATUS_COLORS[invoice.status] },
              ],
            },
            invoice.status,
          ),
        ),
      ),

      // --- Bill to / project / dates ---------------------------------------
      createElement(
        View,
        { style: styles.partiesRow },
        createElement(
          View,
          { style: styles.party },
          createElement(Text, { style: pdfStyles.label }, 'Bill to'),
          createElement(Text, { style: styles.partyName }, client?.name ?? 'No client on file'),
          client?.company
            ? createElement(Text, { style: styles.partyLine }, client.company)
            : null,
          client?.email ? createElement(Text, { style: styles.partyLine }, client.email) : null,
        ),
        createElement(
          View,
          { style: styles.party },
          createElement(Text, { style: pdfStyles.label }, 'Project'),
          createElement(Text, { style: styles.partyName }, project.name),
        ),
        createElement(
          View,
          { style: styles.party },
          createElement(Text, { style: pdfStyles.label }, 'Issued'),
          createElement(Text, { style: styles.partyName }, toDateString(invoice.issueDate)),
          invoice.dueDate
            ? createElement(
                View,
                { style: { marginTop: 8 } },
                createElement(Text, { style: pdfStyles.label }, 'Due'),
                createElement(Text, { style: styles.partyName }, toDateString(invoice.dueDate)),
              )
            : null,
        ),
      ),

      // --- Line items -------------------------------------------------------
      createElement(
        View,
        {},
        createElement(
          View,
          { style: pdfStyles.tableHead },
          createElement(Text, { style: [pdfStyles.th, styles.cellDesc] }, 'Description'),
          createElement(Text, { style: [pdfStyles.th, styles.cellDate] }, 'Date'),
          createElement(Text, { style: [pdfStyles.th, styles.cellAmount] }, 'Amount'),
        ),
        incomeLines.length === 0
          ? createElement(
              View,
              { style: pdfStyles.tr },
              createElement(
                Text,
                { style: pdfStyles.tdMuted },
                'No line items on this invoice.',
              ),
            )
          : incomeLines.map((line) =>
              createElement(
                View,
                { key: line.id, style: pdfStyles.tr },
                createElement(
                  Text,
                  { style: [pdfStyles.td, styles.cellDesc] },
                  line.description || 'Milestone payment',
                ),
                createElement(
                  Text,
                  { style: [pdfStyles.tdMuted, styles.cellDate] },
                  toDateString(line.date),
                ),
                createElement(
                  Text,
                  { style: [pdfStyles.td, styles.cellAmount] },
                  formatMoney(Number(line.amount), line.currency ?? invoice.currency),
                ),
              ),
            ),
      ),

      // --- Total ------------------------------------------------------------
      createElement(
        View,
        { style: styles.totalBlock },
        createElement(
          View,
          { style: styles.totalRow },
          createElement(Text, { style: styles.totalLabel }, `Total ${invoice.currency}`),
          createElement(
            Text,
            { style: styles.totalValue },
            formatMoney(invoice.subtotal, invoice.currency),
          ),
        ),
      ),

      invoice.notes
        ? createElement(
            View,
            { style: styles.notes },
            createElement(Text, { style: pdfStyles.label }, 'Notes'),
            createElement(Text, { style: styles.notesBody }, invoice.notes),
          )
        : null,

      createElement(
        View,
        { style: pdfStyles.footer, fixed: true },
        createElement(Text, {}, `${invoice.invoiceNumber} · ${project.name}`),
        createElement(Text, { render: ({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) => `Page ${pageNumber} of ${totalPages}` }),
      ),
    ),
  );
}
