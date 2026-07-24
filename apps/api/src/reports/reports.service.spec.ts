import { Test } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let mockPrisma: {
    project: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    mockPrisma = { project: { findMany: jest.fn() } };
    const module = await Test.createTestingModule({
      providers: [ReportsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get(ReportsService);
  });

  describe('getProfitability', () => {
    it('ranks projects by profit and computes margin', () => {
      mockPrisma.project.findMany.mockResolvedValue([
        { id: 'proj_1', name: 'Low margin', income: [{ amount: 1000 }], expenses: [{ amount: 900 }] },
        { id: 'proj_2', name: 'High margin', income: [{ amount: 1000 }], expenses: [{ amount: 100 }] },
        { id: 'proj_3', name: 'No income', income: [], expenses: [] },
      ]);

      return service.getProfitability('user_1').then((result) => {
        expect(result.map((r) => r.projectId)).toEqual(['proj_2', 'proj_1', 'proj_3']);
        expect(result[0].margin).toBeCloseTo(0.9);
        expect(result.find((r) => r.projectId === 'proj_3')!.margin).toBe(0);
      });
    });
  });

  describe('getExpenseBreakdown', () => {
    it('groups expenses by category and sorts descending by total', async () => {
      mockPrisma.project.findMany.mockResolvedValue([
        {
          income: [],
          expenses: [
            { category: 'hosting', amount: 50 },
            { category: 'domain', amount: 20 },
            { category: 'hosting', amount: 30 },
          ],
        },
      ]);

      const result = await service.getExpenseBreakdown('user_1');
      expect(result).toEqual([
        { category: 'hosting', total: 80 },
        { category: 'domain', total: 20 },
      ]);
    });
  });

  describe('getMonthly', () => {
    it('filters income and expenses to the requested month only', async () => {
      mockPrisma.project.findMany.mockResolvedValue([
        {
          income: [
            { amount: 1000, date: '2026-05-31T00:00:00.000Z' },
            { amount: 2000, date: '2026-06-01T00:00:00.000Z' },
          ],
          expenses: [{ amount: 100, date: '2026-06-15T00:00:00.000Z' }],
        },
      ]);

      const result = await service.getMonthly('user_1', '2026-06');
      expect(result).toEqual({ month: '2026-06', revenue: 2000, expenses: 100, profit: 1900 });
    });
  });
});
