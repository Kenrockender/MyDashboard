// No JSX here on purpose: adding a `.tsx`/JSX pipeline to this NestJS API
// (tsconfig "jsx" option, Jest transform for .tsx) would touch build config
// shared by the whole backend for the sake of one feature. Plain
// React.createElement calls give @react-pdf/renderer the same element tree
// without any of that.
import { createElement } from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { ReactElement } from 'react';
import { formatMoney } from '../format-money';
import type { Invoice } from '../../invoices/invoices.service';
import type { Project } from '../../projects/projects.service';
import type { Client } from '../../clients/clients.service';
import type { Income } from '../../income/income.service';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: 'Helvetica', color: '#1a1a1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  brand: { fontSize: 18, fontWeight: 700 },
  meta: { textAlign: 'right' },
  section: { marginBottom: 16 },
  label: {
    fontSize: 9,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  rowHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    paddingVertical: 6,
    fontWeight: 700,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 6,
  },
  cellDesc: { flex: 3 },
  cellDate: { flex: 1 },
  cellAmount: { flex: 1, textAlign: 'right' },
  total: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
  totalLabel: { marginRight: 12, fontWeight: 700 },
  totalValue: { fontWeight: 700 },
  notes: { marginTop: 24, fontSize: 10, color: '#444' },
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
    {},
    createElement(
      Page,
      { size: 'A4', style: styles.page },
      createElement(
        View,
        { style: styles.header },
        createElement(Text, { style: styles.brand }, 'Ledger'),
        createElement(
          View,
          { style: styles.meta },
          createElement(Text, {}, invoice.invoiceNumber),
          createElement(Text, {}, `Issued ${toDateString(invoice.issueDate)}`),
          invoice.dueDate
            ? createElement(Text, {}, `Due ${toDateString(invoice.dueDate)}`)
            : null,
        ),
      ),
      createElement(
        View,
        { style: styles.section },
        createElement(Text, { style: styles.label }, 'Bill to'),
        createElement(Text, {}, client?.name ?? 'No client on file'),
        client?.email ? createElement(Text, {}, client.email) : null,
      ),
      createElement(
        View,
        { style: styles.section },
        createElement(Text, { style: styles.label }, 'Project'),
        createElement(Text, {}, project.name),
      ),
      createElement(
        View,
        {},
        createElement(
          View,
          { style: styles.rowHeader },
          createElement(Text, { style: styles.cellDesc }, 'Description'),
          createElement(Text, { style: styles.cellDate }, 'Date'),
          createElement(Text, { style: styles.cellAmount }, 'Amount'),
        ),
        ...incomeLines.map((line) =>
          createElement(
            View,
            { key: line.id, style: styles.row },
            createElement(Text, { style: styles.cellDesc }, line.description || 'Milestone payment'),
            createElement(Text, { style: styles.cellDate }, toDateString(line.date)),
            createElement(
              Text,
              { style: styles.cellAmount },
              formatMoney(Number(line.amount), line.currency ?? invoice.currency),
            ),
          ),
        ),
      ),
      createElement(
        View,
        { style: styles.total },
        createElement(Text, { style: styles.totalLabel }, `Total (${invoice.currency})`),
        createElement(Text, { style: styles.totalValue }, formatMoney(invoice.subtotal, invoice.currency)),
      ),
      invoice.notes
        ? createElement(
            View,
            { style: styles.notes },
            createElement(Text, { style: styles.label }, 'Notes'),
            createElement(Text, {}, invoice.notes),
          )
        : null,
    ),
  );
}

function toDateString(value: Date | string): string {
  return new Date(value).toISOString().slice(0, 10);
}
