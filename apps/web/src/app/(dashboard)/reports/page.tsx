'use client';
import { useState } from 'react';
import {
  useMonthlyReport,
  useTrendReport,
  useProfitabilityReport,
  useExpenseReport,
  useRevenueReport,
} from '@/hooks/use-reports';
import { usePphUmkmEstimate } from '@/hooks/use-tax';
import { TrendChart } from '@/components/dashboard/trend-chart';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { SectionHeading } from '@/components/ui/section-heading';
import { Select } from '@/components/ui/select';
import { CurrencyToggle } from '@/components/ui/currency-toggle';
import { StatRow } from '@/components/ui/stat-group';
import { MeterRow } from '@/components/ui/meter-row';
import { LinkButton } from '@/components/ui/button';
import { Skeleton, ListSkeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { useToast } from '@/lib/toast-context';
import { apiClient } from '@/lib/api-client';
import {
  downloadBlob,
  formatCategory,
  inputClass,
  money,
  moneyCompact,
  moneyRounded,
  percent,
  type Currency,
} from '@/lib/ui';

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function monthLabel(month: string) {
  const date = new Date(`${month}-01T00:00:00`);
  return Number.isNaN(date.getTime())
    ? month
    : new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
}

function DownloadReportPdf({ path, filename }: { path: string; filename: string }) {
  const { showToast } = useToast();
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      const blob = await apiClient.getBlob(path);
      downloadBlob(blob, filename);
    } catch {
      showToast("Couldn't download this report — try again.", 'error');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <LinkButton onClick={handleDownload} disabled={downloading}>
      {downloading ? 'Downloading…' : 'Download PDF'}
    </LinkButton>
  );
}

// One currency at a time (see the toggle in the header), so the table never
// needs a currency column.
const COLUMNS_5 = 'grid grid-cols-[2.2fr_1fr_1fr_1fr_0.9fr] gap-3 px-5';

const CURRENT_YEAR = new Date().getFullYear();
const TAX_YEARS = Array.from({ length: 7 }, (_, i) => CURRENT_YEAR - i);

export default function ReportsPage() {
  const [month, setMonth] = useState(currentMonth());
  const [taxYear, setTaxYear] = useState(new Date().getFullYear());
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('USD');
  const monthlyQuery = useMonthlyReport(month);
  const trendQuery = useTrendReport();
  const taxQuery = usePphUmkmEstimate(taxYear);
  const profitabilityQuery = useProfitabilityReport();
  const expenseQuery = useExpenseReport();
  const revenueQuery = useRevenueReport();

  const { data: monthly } = monthlyQuery;
  const { data: trend } = trendQuery;
  const { data: taxEstimate } = taxQuery;
  const { data: profitability } = profitabilityQuery;
  const { data: expenses } = expenseQuery;
  const { data: revenue } = revenueQuery;

  // Every section used to stack one block per currency, which made the page
  // enormous once a second currency appeared. Now a single toggle picks the
  // currency and every section below follows it — same data, one column of it.
  const availableCurrencies = [
    ...new Set([
      ...(monthly ?? []).map((m) => m.currency),
      ...(profitability ?? []).map((p) => p.currency),
      ...(expenses ?? []).map((e) => e.currency),
      ...(revenue ?? []).map((r) => r.currency),
      ...(trend ?? []).map((t) => t.currency),
    ]),
  ];
  const currencies: Currency[] = availableCurrencies.length > 0 ? availableCurrencies : ['USD'];
  const activeCurrency = currencies.includes(selectedCurrency) ? selectedCurrency : currencies[0];

  const columns = COLUMNS_5;
  const monthlyForCurrency = (monthly ?? []).filter((m) => m.currency === activeCurrency);
  const profitabilityForCurrency = (profitability ?? []).filter((p) => p.currency === activeCurrency);
  const trendForCurrency = (trend ?? []).filter((t) => t.currency === activeCurrency);
  const categoryEntries = (expenses ?? []).filter((e) => e.currency === activeCurrency);
  const clientEntries = (revenue ?? []).filter((r) => r.currency === activeCurrency);
  const expenseTotal = categoryEntries.reduce((sum, e) => sum + e.total, 0);
  const revenueTotal = clientEntries.reduce((sum, r) => sum + r.total, 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reports"
        subtitle="Four cuts of the same ledger — by month, project, category, and client."
        aside={
          currencies.length > 1 ? (
            <CurrencyToggle
              currencies={currencies}
              selected={activeCurrency}
              onSelect={setSelectedCurrency}
            />
          ) : undefined
        }
      />

      <Card>
        <SectionHeading
          className="mb-4"
          aside={
            <div className="flex items-center gap-4">
              <input
                type="month"
                aria-label="Month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className={inputClass}
              />
              <DownloadReportPdf
                path={`/reports/monthly/pdf?month=${month}`}
                filename={`monthly-report-${month}.pdf`}
              />
            </div>
          }
        >
          Monthly summary
        </SectionHeading>

        {monthlyQuery.isLoading && <Skeleton className="h-24 rounded-xl" />}
        {monthlyQuery.isError && (
          <ErrorState message="Couldn't load the monthly summary." onRetry={monthlyQuery.refetch} />
        )}
        {monthly && (
          <>
            <div className="mb-3 font-display text-lg italic text-ink-muted">
              {monthLabel(month)}
            </div>
            {(monthlyForCurrency.length > 0
              ? monthlyForCurrency
              : [{ month, currency: activeCurrency, revenue: 0, expenses: 0, profit: 0 }]
            ).map((m) => (
              <StatRow
                key={m.currency}
                stats={[
                  {
                    label: 'Revenue',
                    value: moneyRounded(m.revenue, m.currency),
                    valueCompact: moneyCompact(m.revenue, m.currency),
                  },
                  {
                    label: 'Expenses',
                    value: moneyRounded(m.expenses, m.currency),
                    valueCompact: moneyCompact(m.expenses, m.currency),
                    tone: 'negative',
                  },
                  {
                    label: 'Profit',
                    value: moneyRounded(m.profit, m.currency),
                    valueCompact: moneyCompact(m.profit, m.currency),
                    tone: 'accent',
                    ruled: true,
                  },
                ]}
              />
            ))}
          </>
        )}
      </Card>

      <section className="space-y-3">
        <SectionHeading
          aside={<DownloadReportPdf path="/reports/trend/pdf" filename="monthly-trend.pdf" />}
        >
          Monthly trend
        </SectionHeading>
        {trendQuery.isLoading && <Skeleton className="h-72 rounded-[14px]" />}
        {trendQuery.isError && (
          <ErrorState message="Couldn't load the monthly trend." onRetry={trendQuery.refetch} />
        )}
        {trend && <TrendChart data={trendForCurrency} currency={activeCurrency} />}
      </section>

      <Card>
        <SectionHeading
          className="mb-4"
          aside={
            <Select
              value={String(taxYear)}
              onChange={(v) => setTaxYear(Number(v))}
              aria-label="Tax year"
              options={TAX_YEARS.map((y) => ({ value: String(y), label: String(y) }))}
              className="w-28"
            />
          }
        >
          Estimasi Pajak — PPh Final UMKM
        </SectionHeading>

        {taxQuery.isLoading && <Skeleton className="h-24 rounded-xl" />}
        {taxQuery.isError && (
          <ErrorState message="Couldn't load the tax estimate." onRetry={taxQuery.refetch} />
        )}
        {taxEstimate && (
          <>
            <StatRow
              stats={[
                { label: 'Omzet (IDR)', value: money(taxEstimate.grossRevenueIdr, 'IDR') },
                {
                  label: 'Batas bebas pajak',
                  value: money(taxEstimate.exemptThresholdIdr, 'IDR'),
                },
                {
                  label: `Estimasi pajak (${percent(taxEstimate.rate, 1)})`,
                  value: money(taxEstimate.estimatedTaxIdr, 'IDR'),
                  tone: 'accent',
                  ruled: true,
                },
              ]}
            />
            <p className="mt-4 rounded-lg border border-border bg-paper px-4 py-3 text-xs leading-relaxed text-ink-muted">
              <strong className="text-ink">Estimasi, bukan nasihat pajak resmi.</strong> Dihitung
              dari PPh Final UMKM 0,5% (PP 20/2026) atas selisih omzet di atas Rp500 juta/tahun,
              khusus wajib pajak orang pribadi. Hanya menghitung income berdenominasi IDR
              berstatus &quot;paid&quot; — tidak berlaku kalau usaha Anda berbentuk badan (PT/CV)
              atau sudah pakai skema tarif progresif. Konsultasikan ke akuntan/konsultan pajak
              untuk kepastian dan pelaporan SPT.
            </p>
          </>
        )}
      </Card>

      <section className="space-y-3">
        {profitabilityQuery.isLoading && <ListSkeleton rows={3} />}
        {profitabilityQuery.isError && (
          <ErrorState message="Couldn't load profitability." onRetry={profitabilityQuery.refetch} />
        )}
        {profitability && (
          <Card padded={false}>
            <div className="flex items-center justify-between gap-4 border-b border-hair px-5 py-4">
              <h2 className="font-display text-lg italic text-ink sm:text-xl">
                Profitability by project
              </h2>
              <DownloadReportPdf path="/reports/profitability/pdf" filename="profitability-report.pdf" />
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[36rem]">
                <div className={`${columns} border-b border-hair py-3`}>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
                    Project
                  </span>
                  {['Income', 'Expenses', 'Profit', 'Margin'].map((h) => (
                    <span
                      key={h}
                      className="text-right font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted"
                    >
                      {h}
                    </span>
                  ))}
                </div>
                {profitabilityForCurrency.length === 0 && (
                  <p className="px-5 py-6 text-center text-sm text-ink-muted">No projects yet.</p>
                )}
                {profitabilityForCurrency.map((p) => (
                  <div
                    key={`${p.projectId}:${p.currency}`}
                    className={`${columns} items-center border-t border-hair py-3.5`}
                  >
                    <span className="truncate text-sm text-ink">{p.name}</span>
                    <span className="text-right font-tabular font-mono text-sm text-ink">
                      {money(p.income, p.currency)}
                    </span>
                    <span className="text-right font-tabular font-mono text-sm text-negative">
                      {money(p.expenses, p.currency)}
                    </span>
                    <span className="text-right font-tabular font-mono text-sm text-ink">
                      {money(p.profit, p.currency)}
                    </span>
                    <span className="text-right font-tabular font-mono text-sm text-accent">
                      {percent(p.margin)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <Card>
          <div className="mb-1 flex items-center justify-between gap-4">
            <h2 className="font-display text-lg italic text-ink sm:text-xl">Expenses by category</h2>
            <DownloadReportPdf path="/reports/expenses/pdf" filename="expense-breakdown.pdf" />
          </div>
          {expenseQuery.isLoading && <Skeleton className="h-48" />}
          {expenseQuery.isError && (
            <ErrorState message="Couldn't load expense breakdown." onRetry={expenseQuery.refetch} />
          )}
          {expenses && categoryEntries.length === 0 && (
            <p className="text-sm text-ink-muted">No expenses yet.</p>
          )}
          {categoryEntries.map((e) => (
            <MeterRow
              key={e.category}
              label={formatCategory(e.category)}
              value={money(e.total, e.currency)}
              share={expenseTotal > 0 ? e.total / expenseTotal : 0}
              tone="negative"
            />
          ))}
        </Card>

        <Card>
          <div className="mb-1 flex items-center justify-between gap-4">
            <h2 className="font-display text-lg italic text-ink sm:text-xl">Revenue by client</h2>
            <DownloadReportPdf path="/reports/revenue/pdf" filename="revenue-by-client.pdf" />
          </div>
          {revenueQuery.isLoading && <Skeleton className="h-48" />}
          {revenueQuery.isError && (
            <ErrorState message="Couldn't load revenue by client." onRetry={revenueQuery.refetch} />
          )}
          {revenue && clientEntries.length === 0 && (
            <p className="text-sm text-ink-muted">No revenue yet.</p>
          )}
          {clientEntries.map((r) => (
            <MeterRow
              key={r.clientId ?? 'none'}
              label={r.clientName}
              value={money(r.total, r.currency)}
              share={revenueTotal > 0 ? r.total / revenueTotal : 0}
            />
          ))}
        </Card>
      </div>
    </div>
  );
}
