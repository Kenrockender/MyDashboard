import { createElement } from 'react';
import { Document, Page, Text, View, StyleSheet, Svg, Rect, Line } from '@react-pdf/renderer';
import type { ReactElement } from 'react';
import { COLORS as THEME, pdfStyles, toDateString } from '../theme';
import type { Currency } from '../../common/currencies';
import type { MonthlyTrendEntry } from '../../dashboard/calculate-monthly-trend';

const styles = StyleSheet.create({
  currencyHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 22,
    marginBottom: 10,
  },
  currencyBadge: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: THEME.accent,
    backgroundColor: THEME.accentSoft,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 3,
    letterSpacing: 1,
  },
  currencyRule: { flex: 1, height: 1, backgroundColor: THEME.border },
  legendRow: { flexDirection: 'row', marginBottom: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  legendSwatch: { width: 8, height: 8, borderRadius: 2, marginRight: 5 },
  legendLabel: { fontSize: 8.5, color: THEME.inkMuted },
  empty: { fontSize: 9.5, color: THEME.inkMuted, marginTop: 24 },
});

// A PDF page is always printed on a light background, so this deliberately
// tracks the app's light-theme palette rather than its dark-mode one.
const COLORS = { revenue: THEME.ink, expenses: THEME.negative, profit: THEME.accent };

/** Buckets rows by currency, preserving first-seen order — mirrors
 *  apps/web/src/lib/ui.ts#groupByCurrency. Each currency gets its own chart;
 *  amounts in different currencies are never drawn on the same axes. */
function groupByCurrency(
  rows: MonthlyTrendEntry[],
): { currency: Currency; rows: MonthlyTrendEntry[] }[] {
  const groups = new Map<Currency, MonthlyTrendEntry[]>();
  for (const row of rows) {
    const list = groups.get(row.currency);
    if (list) list.push(row);
    else groups.set(row.currency, [row]);
  }
  return [...groups.entries()].map(([currency, rows]) => ({ currency, rows }));
}

const CHART_WIDTH = 480;
const CHART_HEIGHT = 190;
const PLOT_LEFT = 8;
const PLOT_BOTTOM = 150;

/** A small hand-drawn grouped bar chart (revenue/expenses/profit per month),
 *  built from @react-pdf/renderer's SVG primitives — there's no charting
 *  library or canvas available in this serverless PDF-rendering path, so
 *  this draws the bars directly rather than pulling in a new dependency. */
function buildChart(entries: MonthlyTrendEntry[]): ReactElement {
  const plotWidth = CHART_WIDTH - PLOT_LEFT * 2;
  const groupWidth = entries.length > 0 ? plotWidth / entries.length : plotWidth;
  const barWidth = Math.min(14, groupWidth / 4);
  const maxValue = Math.max(
    1,
    ...entries.flatMap((e) => [e.revenue, e.expenses, Math.abs(e.profit)]),
  );

  const bars = entries.flatMap((entry, i) => {
    const groupX = PLOT_LEFT + i * groupWidth + groupWidth / 2 - barWidth * 1.5;
    const series: Array<[number, string]> = [
      [entry.revenue, COLORS.revenue],
      [entry.expenses, COLORS.expenses],
      [entry.profit, COLORS.profit],
    ];
    return series.map(([value, color], si) => {
      const barHeight = (Math.max(0, value) / maxValue) * PLOT_BOTTOM;
      return createElement(Rect, {
        key: `${entry.month}-${si}`,
        x: groupX + si * barWidth,
        y: PLOT_BOTTOM - barHeight,
        width: Math.max(0, barWidth - 1),
        height: Math.max(0, barHeight),
        fill: color,
      });
    });
  });

  const monthLabels = entries.map((entry, i) =>
    createElement(
      Text,
      {
        key: entry.month,
        x: PLOT_LEFT + i * groupWidth + groupWidth / 2,
        y: PLOT_BOTTOM + 12,
        textAnchor: 'middle' as const,
        style: { fontSize: 7, fill: THEME.inkMuted } as any,
      },
      // "2026-06" -> "26-06", compact enough for the axis at this chart width.
      entry.month.slice(2),
    ),
  );

  return createElement(
    Svg,
    { width: CHART_WIDTH, height: CHART_HEIGHT, viewBox: `0 0 ${CHART_WIDTH} ${CHART_HEIGHT}` },
    createElement(Line, {
      x1: PLOT_LEFT,
      y1: PLOT_BOTTOM,
      x2: CHART_WIDTH - PLOT_LEFT,
      y2: PLOT_BOTTOM,
      stroke: THEME.border,
      strokeWidth: 1,
    }),
    ...bars,
    ...monthLabels,
  );
}

function buildLegend(): ReactElement {
  const items: Array<[string, string]> = [
    ['Revenue', COLORS.revenue],
    ['Expenses', COLORS.expenses],
    ['Profit', COLORS.profit],
  ];
  return createElement(
    View,
    { style: styles.legendRow },
    ...items.map(([label, color]) =>
      createElement(
        View,
        { key: label, style: styles.legendItem },
        createElement(View, { style: { ...styles.legendSwatch, backgroundColor: color } }),
        createElement(Text, { style: styles.legendLabel }, label),
      ),
    ),
  );
}

/** Builds the `<Document>` element for the monthly trend report, one chart
 *  per currency. Mirrors buildReportDocument's per-currency sectioning —
 *  amounts in different currencies are never combined on one chart. */
export function buildTrendDocument({
  rows,
  generatedAt,
}: {
  rows: MonthlyTrendEntry[];
  generatedAt: Date;
}): ReactElement<any> {
  const groups = groupByCurrency(rows);

  return createElement(
    Document,
    { title: 'Monthly Trend', author: 'Ledger' },
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
          createElement(Text, { style: pdfStyles.docTitle }, 'Monthly Trend'),
          createElement(
            Text,
            { style: pdfStyles.docMeta },
            `Generated ${toDateString(generatedAt)}`,
          ),
        ),
      ),

      groups.length === 0
        ? createElement(Text, { style: styles.empty }, 'No data for this report.')
        : groups.map((group) =>
            createElement(
              View,
              { key: group.currency },
              createElement(
                View,
                { style: styles.currencyHeading },
                createElement(Text, { style: styles.currencyBadge }, group.currency),
                createElement(View, { style: styles.currencyRule }),
              ),
              buildLegend(),
              buildChart(group.rows),
            ),
          ),

      createElement(
        View,
        { style: pdfStyles.footer, fixed: true },
        createElement(Text, {}, 'Ledger · Monthly Trend'),
        createElement(Text, {
          render: ({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
            `Page ${pageNumber} of ${totalPages}`,
        }),
      ),
    ),
  );
}
