import { NextRequest } from 'next/server';

jest.mock('@/server/require-user', () => ({ requireUser: jest.fn() }));
jest.mock('@/server/time-entries/time-entries.service', () => ({
  timeEntriesService: {
    create: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    logAsIncome: jest.fn(),
  },
}));

import { requireUser } from '@/server/require-user';
import { timeEntriesService } from '@/server/time-entries/time-entries.service';
import { POST } from './route';

const mockRequireUser = requireUser as jest.Mock;
const mockTimeEntriesService = timeEntriesService as jest.Mocked<typeof timeEntriesService>;

describe('POST /api/time-entries/[id]/log-income', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the logged time entry wrapped in the { data } envelope', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });
    mockTimeEntriesService.logAsIncome.mockResolvedValue({
      id: 'time_entry_1',
      userId: 'user_1',
      projectId: 'project_1',
      hours: 5,
      date: new Date(),
      hourlyRate: 100,
      currency: 'USD',
      status: 'logged',
      incomeId: 'income_1',
      createdAt: new Date(),
    });

    const req = new NextRequest('http://localhost/api/time-entries/time_entry_1/log-income', { method: 'POST' });
    const res = await POST(req, { params: Promise.resolve({ id: 'time_entry_1' }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.status).toBe('logged');
    expect(mockTimeEntriesService.logAsIncome).toHaveBeenCalledWith('user_1', 'time_entry_1');
  });

  it('rejects an unauthenticated request with 401', async () => {
    const { UnauthorizedException } = jest.requireActual('@nestjs/common');
    mockRequireUser.mockRejectedValue(new UnauthorizedException());

    const req = new NextRequest('http://localhost/api/time-entries/time_entry_1/log-income', { method: 'POST' });
    const res = await POST(req, { params: Promise.resolve({ id: 'time_entry_1' }) });
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.statusCode).toBe(401);
    expect(mockTimeEntriesService.logAsIncome).not.toHaveBeenCalled();
  });
});
