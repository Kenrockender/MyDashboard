import { createElement } from 'react';
import { Document, Page, Text, View, StyleSheet, Svg, Rect, Line } from '@react-pdf/renderer';
import type { ReactElement } from 'react';
import type { Currency } from '../../common/currencies';
import type { MonthlyTrendEntry } from '../../dashboard/calculate-monthly-trend';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: 'Helvetica', color: '#1a1a1a' },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 4 },
  subtitle: { fontSize: 10, color: '#666', marginBottom: 20 },
  currencyHeading: { fontSize: 11, fontWeight: 700, marginTop: 20, marginBottom: 8 },
  legendRow: { flexDirection: 'row', marginBottom: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  legendSwatch: { width: 8, height: 8, marginRight: 4 },
  legendLabel: { fontSize: 9, color: '#444' },
});

// Matches the light-theme values in apps/web/src/app/globals.css — a PDF page
// is always printed on a light background, so this deliberately doesn't
// follow the app's dark-mode palette.
const COLORS = { revenue: '#1a1a1a', expenses: '#af3f28', profit: '#1f6f4f' };

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
        style: { fontSize: 7, fill: '#666' } as any,
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
      stroke: '#ddd',
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
    {},
    createElement(
      Page,
      { size: 'A4', style: styles.page },
      createElement(Text, { style: styles.title }, 'Monthly Trend'),
      createElement(
        Text,
        { style: styles.subtitle },
        `Generated ${generatedAt.toISOString().slice(0, 10)}`,
      ),
      groups.length === 0
        ? createElement(Text, {}, 'No data for this report.')
        : groups.map((group) =>
            createElement(
              View,
              { key: group.currency },
              createElement(Text, { style: styles.currencyHeading }, group.currency),
              buildLegend(),
              buildChart(group.rows),
            ),
          ),
    ),
  );
}
