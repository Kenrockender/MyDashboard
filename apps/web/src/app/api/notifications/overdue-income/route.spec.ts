import { NextRequest } from 'next/server';

jest.mock('@/server/require-user', () => ({ requireUser: jest.fn() }));
jest.mock('@/server/notifications/notifications.service', () => ({
  notificationsService: { getOverdueIncome: jest.fn() },
}));

import { requireUser } from '@/server/require-user';
import { notificationsService } from '@/server/notifications/notifications.service';
import { GET } from './route';

const mockRequireUser = requireUser as jest.Mock;
const mockNotificationsService = notificationsService as jest.Mocked<typeof notificationsService>;

describe('GET /api/notifications/overdue-income', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the overdue income summary wrapped in the { data } envelope', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });
    mockNotificationsService.getOverdueIncome.mockResolvedValue({ entries: [], totalsByCurrency: [] });

    const req = new NextRequest('http://localhost/api/notifications/overdue-income');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual({ entries: [], totalsByCurrency: [] });
    expect(mockNotificationsService.getOverdueIncome).toHaveBeenCalledWith('user_1');
  });

  it('rejects an unauthenticated request with 401', async () => {
    const { UnauthorizedException } = jest.requireActual('@nestjs/common');
    mockRequireUser.mockRejectedValue(new UnauthorizedException());

    const req = new NextRequest('http://localhost/api/notifications/overdue-income');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.statusCode).toBe(401);
    expect(mockNotificationsService.getOverdueIncome).not.toHaveBeenCalled();
  });
});
