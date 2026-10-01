// `reportsService` imports `db` as a module-level singleton (no DI to swap in
// a fake), so the fake Firestore is substituted by mocking the `../firebase`
// module itself.
let mockDb: ReturnType<typeof createFakeFirestore>['db'];
let collectionReads: string[];

jest.mock('../firebase', () => ({
  get db() {
    // Counts every `.collection(name)` the service opens, which is what the
    // Firestore read quota is actually spent on.
    return {
      ...mockDb,
      collection(name: string) {
        collectionReads.push(name);
        return mockDb.collection(name);
      },
    };
  },
}));

import { createFakeFirestore } from '../testing/fake-firestore';
import { reportsService } from './reports.service';
import { wibYear } from '../common/wib-date';

const THIS_YEAR = wibYear(new Date());

function seed() {
  return createFakeFirestore({
    projects: [
      { id: 'proj_1', userId: 'user_1', name: 'Website', clientId: 'client_1' },
      { id: 'proj_2', userId: 'user_1', name: 'App', clientId: null },
    ],
    clients: [{ id: 'client_1', userId: 'user_1', name: 'Aurora' }],
    income: [
      {
        id: 'inc_1',
        userId: 'user_1',
        projectId: 'proj_1',
        amount: 1000,
        currency: 'USD',
        status: 'paid',
        date: `${THIS_YEAR}-03-10T00:00:00.000Z`,
      },
      {
        id: 'inc_2',
        userId: 'user_1',
        projectId: 'proj_2',
        amount: 800_000_000,
        currency: 'IDR',
        status: 'paid',
        date: `${THIS_YEAR}-04-10T00:00:00.000Z`,
      },
    ],
    expenses: [
      {
        id: 'exp_1',
        userId: 'user_1',
        projectId: 'proj_1',
        amount: 200,
        currency: 'USD',
        category: 'hosting',
        date: `${THIS_YEAR}-03-12T00:00:00.000Z`,
      },
    ],
  }).db;
}

describe('ReportsService.getSummary', () => {
  beforeEach(() => {
    collectionReads = [];
    mockDb = seed();
  });

  it('answers every report from a single pass over each collection', async () => {
    await reportsService.getSummary('user_1');

    // The regression this endpoint exists to prevent: the Reports page used to
    // call six endpoints that each re-read income and expenses for themselves,
    // costing 14 collection reads per page load. The summary reads each of the
    // four report collections once, plus the user's settings doc once (needed
    // to know whether the PPh UMKM figure applies at all).
    expect(collectionReads).toHaveLength(5);
    expect(collectionReads.filter((c) => c === 'income')).toHaveLength(1);
    expect(collectionReads.filter((c) => c === 'expenses')).toHaveLength(1);
    expect(collectionReads.filter((c) => c === 'projects')).toHaveLength(1);
    expect(collectionReads.filter((c) => c === 'clients')).toHaveLength(1);
    expect(collectionReads.filter((c) => c === 'settings')).toHaveLength(1);
  });

  it('returns the same figures the individual report endpoints do', async () => {
    const summary = await reportsService.getSummary('user_1');

    collectionReads = [];
    const [profitability, expenseBreakdown, revenueBreakdown, trend] = await Promise.all([
      reportsService.getProfitability('user_1'),
      reportsService.getExpenseBreakdown('user_1'),
      reportsService.getRevenueBreakdown('user_1'),
      reportsService.getMonthlyTrend('user_1'),
    ]);

    expect(summary.profitability).toEqual(profitability);
    expect(summary.expenseBreakdown).toEqual(expenseBreakdown);
    expect(summary.revenueBreakdown).toEqual(revenueBreakdown);
    expect(summary.trend).toEqual(trend);
  });

  it('carries every month, so the monthly card can filter instead of refetching', async () => {
    const summary = await reportsService.getSummary('user_1');
    const months = new Set(summary.trend.map((t) => t.month));

    expect(months.has(`${THIS_YEAR}-03`)).toBe(true);
    expect(months.has(`${THIS_YEAR}-04`)).toBe(true);
  });

  it('returns a span of tax years, newest first, so the dropdown needs no refetch', async () => {
    const summary = await reportsService.getSummary('user_1');
    const years = summary.taxEstimates.map((e) => e.year);

    expect(years).toHaveLength(7);
    expect(years[0]).toBe(THIS_YEAR);
    expect(years).toEqual([...years].sort((a, b) => b - a));
  });

  it('computes the PPh UMKM estimate from IDR paid income only', async () => {
    const summary = await reportsService.getSummary('user_1');
    const thisYear = summary.taxEstimates.find((e) => e.year === THIS_YEAR)!;

    // 800m IDR gross, 500m exempt, 0.5% of the 300m excess. The USD income is
    // excluded rather than converted.
    expect(thisYear.grossRevenueIdr).toBe(800_000_000);
    expect(thisYear.estimatedTaxIdr).toBe(1_500_000);
  });

  it('leaves incomeType undefined and still returns estimates when the question is unanswered', async () => {
    const summary = await reportsService.getSummary('user_1');
    expect(summary.incomeType).toBeUndefined();
    expect(summary.taxEstimates).toHaveLength(7);
  });

  it('returns no tax estimates when the user is taxed as professional services', async () => {
    mockDb = seed();
    await mockDb.collection('settings').doc('user_1').set({ incomeType: 'professional' });

    const summary = await reportsService.getSummary('user_1');
    expect(summary.incomeType).toBe('professional');
    expect(summary.taxEstimates).toEqual([]);
  });

  it('returns estimates and echoes incomeType when the user is taxed as business', async () => {
    mockDb = seed();
    await mockDb.collection('settings').doc('user_1').set({ incomeType: 'business' });

    const summary = await reportsService.getSummary('user_1');
    expect(summary.incomeType).toBe('business');
    expect(summary.taxEstimates.find((e) => e.year === THIS_YEAR)!.estimatedTaxIdr).toBe(1_500_000);
  });

  it('scopes every section to the authenticated user', async () => {
    mockDb = createFakeFirestore({
      projects: [{ id: 'proj_x', userId: 'user_2', name: 'Someone else', clientId: null }],
      clients: [{ id: 'client_x', userId: 'user_2', name: 'Other' }],
      income: [
        {
          id: 'inc_x',
          userId: 'user_2',
          projectId: 'proj_x',
          amount: 999,
          currency: 'USD',
          status: 'paid',
          date: `${THIS_YEAR}-03-10T00:00:00.000Z`,
        },
      ],
      expenses: [],
    }).db;

    const summary = await reportsService.getSummary('user_1');
    expect(summary.profitability).toEqual([]);
    expect(summary.trend).toEqual([]);
    expect(summary.revenueBreakdown).toEqual([]);
  });
});
