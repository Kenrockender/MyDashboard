import { createElement } from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { ReactElement } from 'react';
import { formatMoney } from '../format-money';
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
  page: { padding: 40, fontSize: 11, fontFamily: 'Helvetica', color: '#1a1a1a' },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 4 },
  subtitle: { fontSize: 10, color: '#666', marginBottom: 20 },
  currencyHeading: { fontSize: 11, fontWeight: 700, marginTop: 16, marginBottom: 6 },
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
  cell: { flex: 2 },
  cellNum: { flex: 1, textAlign: 'right' },
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
    {},
    createElement(
      Page,
      { size: 'A4', style: styles.page },
      createElement(Text, { style: styles.title }, TITLES[type]),
      createElement(
        Text,
        { style: styles.subtitle },
        `Generated ${generatedAt.toISOString().slice(0, 10)}${contextLabel ? ` · ${contextLabel}` : ''}`,
      ),
      groups.length === 0
        ? createElement(Text, {}, 'No data for this report.')
        : groups.map((group) => {
            const { headers, cells } = tableFor(type, group.rows);
            return createElement(
              View,
              { key: group.currency },
              createElement(Text, { style: styles.currencyHeading }, group.currency),
              createElement(
                View,
                { style: styles.rowHeader },
                ...headers.map((h, i) =>
                  createElement(Text, { key: i, style: i === 0 ? styles.cell : styles.cellNum }, h),
                ),
              ),
              ...cells.map((cellRow, ri) =>
                createElement(
                  View,
                  { key: ri, style: styles.row },
                  ...cellRow.map((c, ci) =>
                    createElement(Text, { key: ci, style: ci === 0 ? styles.cell : styles.cellNum }, c),
                  ),
                ),
              ),
            );
          }),
    ),
  );
}
