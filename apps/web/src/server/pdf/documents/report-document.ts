import { createElement } from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { ReactElement } from 'react';
import { formatMoney } from '../format-money';
import { COLORS, pdfStyles, toDateString } from '../theme';
import type { Currency } from '../../common/currencies';

export type ReportType = 'monthly' | 'profitability' | 'expenses' | 'revenue';

interface MonthlyRow {
  month: string;
  currency: Currency;
  revenue: number;
  expenses: number;
  profit: number;
}
interface ProfitabilityRow {
  projectId: string;
  name: string;
  currency: Currency;
  income: number;
  expenses: number;
  profit: number;
  margin: number;
}
interface ExpenseRow {
  category: string;
  currency: Currency;
  total: number;
}
interface RevenueRow {
  clientId: string | null;
  clientName: string;
  currency: Currency;
  total: number;
}
export type ReportRow = MonthlyRow | ProfitabilityRow | ExpenseRow | RevenueRow;

const TITLES: Record<ReportType, string> = {
  monthly: 'Monthly Report',
  profitability: 'Profitability Report',
  expenses: 'Expense Breakdown',
  revenue: 'Revenue by Client',
};

const styles = StyleSheet.create({
  currencyHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 22,
    marginBottom: 8,
  },
  currencyBadge: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.accent,
    backgroundColor: COLORS.accentSoft,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 3,
    letterSpacing: 1,
  },
  currencyRule: { flex: 1, height: 1, backgroundColor: COLORS.border },
  cell: { flex: 2.2 },
  cellNum: { flex: 1, textAlign: 'right' },
  empty: { fontSize: 9.5, color: COLORS.inkMuted, marginTop: 24 },
});

/** Buckets rows by currency, preserving first-seen order — mirrors
 *  apps/web/src/lib/ui.ts#groupByCurrency. Report figures in different
 *  currencies are rendered in separate sections, never summed together. */
function groupByCurrency<T extends { currency: Currency }>(
  rows: T[],
): { currency: Currency; rows: T[] }[] {
  const groups = new Map<Currency, T[]>();
  for (const row of rows) {
    const list = groups.get(row.currency);
    if (list) list.push(row);
    else groups.set(row.currency, [row]);
  }
  return [...groups.entries()].map(([currency, rows]) => ({ currency, rows }));
}

function tableFor(
  type: ReportType,
  rows: ReportRow[],
): { headers: string[]; cells: string[][] } {
  switch (type) {
    case 'monthly': {
      const r = rows as MonthlyRow[];
      return {
        headers: ['Month', 'Revenue', 'Expenses', 'Profit'],
        cells: r.map((row) => [
          row.month,
          formatMoney(row.revenue, row.currency),
          formatMoney(row.expenses, row.currency),
          formatMoney(row.profit, row.currency),
        ]),
      };
    }
    case 'profitability': {
      const r = rows as ProfitabilityRow[];
      return {
        headers: ['Project', 'Income', 'Expenses', 'Profit', 'Margin'],
        cells: r.map((row) => [
          row.name,
          formatMoney(row.income, row.currency),
          formatMoney(row.expenses, row.currency),
          formatMoney(row.profit, row.currency),
          `${(row.margin * 100).toFixed(1)}%`,
        ]),
      };
    }
    case 'expenses': {
      const r = rows as ExpenseRow[];
      return {
        headers: ['Category', 'Total'],
        cells: r.map((row) => [row.category.replace(/_/g, ' '), formatMoney(row.total, row.currency)]),
      };
    }
    case 'revenue': {
      const r = rows as RevenueRow[];
      return {
        headers: ['Client', 'Total'],
        cells: r.map((row) => [row.clientName, formatMoney(row.total, row.currency)]),
      };
    }
  }
}

/**
 * Builds the `<Document>` element for a report, one section per currency.
 * Return type is `ReactElement<any>` for the same interop reason documented
 * in invoice-document.ts (react-pdf's DocumentProps isn't a named export).
 */
export function buildReportDocument({
  type,
  rows,
  generatedAt,
  contextLabel,
}: {
  type: ReportType;
  rows: ReportRow[];
  generatedAt: Date;
  contextLabel?: string;
}): ReactElement<any> {
  const groups = groupByCurrency(rows);

  return createElement(
    Document,
    { title: TITLES[type], author: 'Ledger' },
    createElement(
      Page,
      { size: 'A4', style: pdfStyles.page },

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
          createElement(Text, { style: pdfStyles.docTitle }, TITLES[type]),
          createElement(
            Text,
            { style: pdfStyles.docMeta },
            `Generated ${toDateString(generatedAt)}${contextLabel ? ` · ${contextLabel}` : ''}`,
          ),
        ),
      ),

      groups.length === 0
        ? createElement(Text, { style: styles.empty }, 'No data for this report.')
        : groups.map((group) => {
            const { headers, cells } = tableFor(type, group.rows);
            return createElement(
              View,
              { key: group.currency },
              // Each currency gets its own table — figures in different
              // currencies are never summed together anywhere in this app.
              createElement(
                View,
                { style: styles.currencyHeading },
                createElement(Text, { style: styles.currencyBadge }, group.currency),
                createElement(View, { style: styles.currencyRule }),
              ),
              createElement(
                View,
                { style: pdfStyles.tableHead },
                ...headers.map((h, i) =>
                  createElement(
                    Text,
                    { key: i, style: [pdfStyles.th, i === 0 ? styles.cell : styles.cellNum] },
                    h,
                  ),
                ),
              ),
              ...cells.map((cellRow, ri) =>
                createElement(
                  View,
                  { key: ri, style: pdfStyles.tr },
                  ...cellRow.map((c, ci) =>
                    createElement(
                      Text,
                      {
                        key: ci,
                        style: [
                          ci === 0 ? pdfStyles.td : pdfStyles.td,
                          ci === 0 ? styles.cell : styles.cellNum,
                        ],
                      },
                      c,
                    ),
                  ),
                ),
              ),
            );
          }),

      createElement(
        View,
        { style: pdfStyles.footer, fixed: true },
        createElement(Text, {}, `Ledger · ${TITLES[type]}`),
        createElement(Text, {
          render: ({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
            `Page ${pageNumber} of ${totalPages}`,
        }),
      ),
    ),
  );
}
