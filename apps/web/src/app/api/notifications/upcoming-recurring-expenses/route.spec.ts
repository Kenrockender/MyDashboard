import { NextRequest } from 'next/server';

jest.mock('@/server/require-user', () => ({ requireUser: jest.fn() }));
jest.mock('@/server/notifications/notifications.service', () => ({
  notificationsService: { getUpcomingRecurringExpenses: jest.fn() },
}));

import { requireUser } from '@/server/require-user';
import { notificationsService } from '@/server/notifications/notifications.service';
import { GET } from './route';

const mockRequireUser = requireUser as jest.Mock;
const mockNotificationsService = notificationsService as jest.Mocked<typeof notificationsService>;

describe('GET /api/notifications/upcoming-recurring-expenses', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the upcoming recurring expenses summary wrapped in the { data } envelope', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });
    mockNotificationsService.getUpcomingRecurringExpenses.mockResolvedValue({ entries: [] });

    const req = new NextRequest('http://localhost/api/notifications/upcoming-recurring-expenses');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual({ entries: [] });
    expect(mockNotificationsService.getUpcomingRecurringExpenses).toHaveBeenCalledWith('user_1');
  });

  it('rejects an unauthenticated request with 401', async () => {
    const { UnauthorizedException } = jest.requireActual('@nestjs/common');
    mockRequireUser.mockRejectedValue(new UnauthorizedException());

    const req = new NextRequest('http://localhost/api/notifications/upcoming-recurring-expenses');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.statusCode).toBe(401);
    expect(mockNotificationsService.getUpcomingRecurringExpenses).not.toHaveBeenCalled();
  });
});
