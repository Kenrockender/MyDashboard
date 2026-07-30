let mockDb: ReturnType<typeof createFakeFirestore>['db'];

jest.mock('../firebase', () => ({
  get db() {
    return mockDb;
  },
}));

import { createFakeFirestore } from '../testing/fake-firestore';
import { reportsService } from './reports.service';

describe('ReportsService', () => {
  describe('getProfitability', () => {
    it('ranks projects by profit and computes margin', async () => {
      mockDb = createFakeFirestore({
        projects: [
          { id: 'proj_1', userId: 'user_1', name: 'Low margin' },
          { id: 'proj_2', userId: 'user_1', name: 'High margin' },
          { id: 'proj_3', userId: 'user_1', name: 'No income' },
        ],
        income: [
          { id: 'i1', userId: 'user_1', projectId: 'proj_1', amount: 1000 },
          { id: 'i2', userId: 'user_1', projectId: 'proj_2', amount: 1000 },
        ],
        expenses: [
          { id: 'e1', userId: 'user_1', projectId: 'proj_1', amount: 900 },
          { id: 'e2', userId: 'user_1', projectId: 'proj_2', amount: 100 },
        ],
      }).db;

      const result = await reportsService.getProfitability('user_1');
      expect(result.map((r) => r.projectId)).toEqual([
        'proj_2',
        'proj_1',
        'proj_3',
      ]);
      expect(result[0].margin).toBeCloseTo(0.9);
      expect(result.find((r) => r.projectId === 'proj_3')!.margin).toBe(0);
    });
  });

  describe('getExpenseBreakdown', () => {
    it('groups expenses by category and sorts descending by total', async () => {
      mockDb = createFakeFirestore({
        expenses: [
          { id: 'e1', userId: 'user_1', category: 'hosting', amount: 50 },
          { id: 'e2', userId: 'user_1', category: 'domain', amount: 20 },
          { id: 'e3', userId: 'user_1', category: 'hosting', amount: 30 },
        ],
      }).db;

      expect(await reportsService.getExpenseBreakdown('user_1')).toEqual([
        { category: 'hosting', currency: 'USD', total: 80 },
        { category: 'domain', currency: 'USD', total: 20 },
      ]);
    });

    it('keeps different currencies in the same category as separate rows', async () => {
      mockDb = createFakeFirestore({
        expenses: [
          {
            id: 'e1',
            userId: 'user_1',
            category: 'hosting',
            amount: 50,
            currency: 'USD',
          },
          {
            id: 'e2',
            userId: 'user_1',
            category: 'hosting',
            amount: 500000,
            currency: 'IDR',
          },
        ],
      }).db;

      expect(await reportsService.getExpenseBreakdown('user_1')).toEqual([
        { category: 'hosting', currency: 'IDR', total: 500000 },
        { category: 'hosting', currency: 'USD', total: 50 },
      ]);
    });
  });

  describe('getMonthly', () => {
    it('filters income and expenses to the requested month only', async () => {
      mockDb = createFakeFirestore({
        income: [
          {
            id: 'i1',
            userId: 'user_1',
            amount: 1000,
            date: '2026-05-31T00:00:00.000Z',
          },
          {
            id: 'i2',
            userId: 'user_1',
            amount: 2000,
            date: '2026-06-01T00:00:00.000Z',
          },
        ],
        expenses: [
          {
            id: 'e1',
            userId: 'user_1',
            amount: 100,
            date: '2026-06-15T00:00:00.000Z',
          },
        ],
      }).db;

      expect(await reportsService.getMonthly('user_1', '2026-06')).toEqual([
        {
          month: '2026-06',
          currency: 'USD',
          revenue: 2000,
          expenses: 100,
          profit: 1900,
        },
      ]);
    });
  });

  describe('getMonthlyTrend', () => {
    it('returns every month with activity, not just one', async () => {
      mockDb = createFakeFirestore({
        income: [
          { id: 'i1', userId: 'user_1', amount: 1000, date: '2026-05-15T00:00:00.000Z' },
          { id: 'i2', userId: 'user_1', amount: 2000, date: '2026-06-01T00:00:00.000Z' },
        ],
        expenses: [
          { id: 'e1', userId: 'user_1', amount: 100, date: '2026-06-15T00:00:00.000Z' },
        ],
      }).db;

      const result = await reportsService.getMonthlyTrend('user_1');
      expect(result).toEqual([
        { month: '2026-05', currency: 'USD', revenue: 1000, expenses: 0, profit: 1000 },
        { month: '2026-06', currency: 'USD', revenue: 2000, expenses: 100, profit: 1900 },
      ]);
    });
  });

  describe('scoping', () => {
    it('excludes records belonging to another user', async () => {
      mockDb = createFakeFirestore({
        expenses: [
          { id: 'e1', userId: 'user_1', category: 'hosting', amount: 50 },
          { id: 'e2', userId: 'user_2', category: 'hosting', amount: 999 },
        ],
      }).db;

      expect(await reportsService.getExpenseBreakdown('user_1')).toEqual([
        { category: 'hosting', currency: 'USD', total: 50 },
      ]);
    });
  });
});
