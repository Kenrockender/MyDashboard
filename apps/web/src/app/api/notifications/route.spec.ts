import { NextRequest } from 'next/server';

jest.mock('@/server/require-user', () => ({ requireUser: jest.fn() }));
jest.mock('@/server/notifications/notifications.service', () => ({
  notificationsService: { getAll: jest.fn() },
}));

import { requireUser } from '@/server/require-user';
import { notificationsService } from '@/server/notifications/notifications.service';
import { GET } from './route';

const mockRequireUser = requireUser as jest.Mock;
const mockNotificationsService = notificationsService as jest.Mocked<typeof notificationsService>;

describe('GET /api/notifications', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns both notification kinds wrapped in the { data } envelope', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });
    mockNotificationsService.getAll.mockResolvedValue({
      overdueIncome: { entries: [], totalsByCurrency: [] },
      upcomingRecurringExpenses: { entries: [] },
    });

    const req = new NextRequest('http://localhost/api/notifications');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual({
      overdueIncome: { entries: [], totalsByCurrency: [] },
      upcomingRecurringExpenses: { entries: [] },
    });
    expect(mockNotificationsService.getAll).toHaveBeenCalledWith('user_1');
  });

  it('rejects an unauthenticated request with 401', async () => {
    const { UnauthorizedException } = jest.requireActual('@nestjs/common');
    mockRequireUser.mockRejectedValue(new UnauthorizedException());

    const req = new NextRequest('http://localhost/api/notifications');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.statusCode).toBe(401);
    expect(mockNotificationsService.getAll).not.toHaveBeenCalled();
  });
});
