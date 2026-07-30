import { NextRequest } from 'next/server';

jest.mock('@/server/require-user', () => ({ requireUser: jest.fn() }));
jest.mock('@/server/dashboard/dashboard.service', () => ({
  dashboardService: { getSummary: jest.fn() },
}));

import { requireUser } from '@/server/require-user';
import { dashboardService } from '@/server/dashboard/dashboard.service';
import { GET } from './route';

const mockRequireUser = requireUser as jest.Mock;
const mockDashboardService = dashboardService as jest.Mocked<typeof dashboardService>;

describe('GET /api/dashboard/summary', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the dashboard summary wrapped in the { data } envelope', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });
    mockDashboardService.getSummary.mockResolvedValue({
      totals: [],
      activeProjects: 0,
      completedProjects: 0,
      monthlyTrend: [],
      recentActivity: [],
    });

    const req = new NextRequest('http://localhost/api/dashboard/summary');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.activeProjects).toBe(0);
    expect(mockDashboardService.getSummary).toHaveBeenCalledWith('user_1');
  });

  it('rejects an unauthenticated request with 401', async () => {
    const { UnauthorizedException } = jest.requireActual('@nestjs/common');
    mockRequireUser.mockRejectedValue(new UnauthorizedException());

    const req = new NextRequest('http://localhost/api/dashboard/summary');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.statusCode).toBe(401);
    expect(mockDashboardService.getSummary).not.toHaveBeenCalled();
  });
});
