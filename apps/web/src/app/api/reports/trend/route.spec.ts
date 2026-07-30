import { NextRequest } from 'next/server';

jest.mock('@/server/require-user', () => ({ requireUser: jest.fn() }));
jest.mock('@/server/reports/reports.service', () => ({
  reportsService: {
    getMonthly: jest.fn(),
    getMonthlyTrend: jest.fn(),
    getProfitability: jest.fn(),
    getExpenseBreakdown: jest.fn(),
    getRevenueBreakdown: jest.fn(),
  },
}));

import { requireUser } from '@/server/require-user';
import { reportsService } from '@/server/reports/reports.service';
import { GET } from './route';

const mockRequireUser = requireUser as jest.Mock;
const mockReportsService = reportsService as jest.Mocked<typeof reportsService>;

describe('GET /api/reports/trend', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the trend wrapped in the { data } envelope', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });
    mockReportsService.getMonthlyTrend.mockResolvedValue([]);

    const req = new NextRequest('http://localhost/api/reports/trend');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual([]);
    expect(mockReportsService.getMonthlyTrend).toHaveBeenCalledWith('user_1');
  });

  it('rejects an unauthenticated request with 401', async () => {
    const { UnauthorizedException } = jest.requireActual('@nestjs/common');
    mockRequireUser.mockRejectedValue(new UnauthorizedException());

    const req = new NextRequest('http://localhost/api/reports/trend');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.statusCode).toBe(401);
    expect(mockReportsService.getMonthlyTrend).not.toHaveBeenCalled();
  });
});
