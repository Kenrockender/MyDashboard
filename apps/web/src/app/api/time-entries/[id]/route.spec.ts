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
import { PATCH, DELETE } from './route';

const mockRequireUser = requireUser as jest.Mock;
const mockTimeEntriesService = timeEntriesService as jest.Mocked<typeof timeEntriesService>;

describe('PATCH /api/time-entries/[id]', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the updated time entry wrapped in the { data } envelope', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });
    mockTimeEntriesService.update.mockResolvedValue({
      id: 'time_entry_1',
      userId: 'user_1',
      projectId: 'project_1',
      hours: 5,
      date: new Date(),
      currency: 'USD',
      status: 'unlogged',
      createdAt: new Date(),
    });

    const req = new NextRequest('http://localhost/api/time-entries/time_entry_1', {
      method: 'PATCH',
      body: JSON.stringify({ hours: 5 }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'time_entry_1' }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.hours).toBe(5);
    expect(mockTimeEntriesService.update).toHaveBeenCalledWith('user_1', 'time_entry_1', { hours: 5 });
  });

  it('rejects an unauthenticated request with 401', async () => {
    const { UnauthorizedException } = jest.requireActual('@nestjs/common');
    mockRequireUser.mockRejectedValue(new UnauthorizedException());

    const req = new NextRequest('http://localhost/api/time-entries/time_entry_1', {
      method: 'PATCH',
      body: JSON.stringify({ hours: 5 }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'time_entry_1' }) });
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.statusCode).toBe(401);
    expect(mockTimeEntriesService.update).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/time-entries/[id]', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the removed id wrapped in the { data } envelope', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });
    mockTimeEntriesService.remove.mockResolvedValue({ id: 'time_entry_1' });

    const req = new NextRequest('http://localhost/api/time-entries/time_entry_1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'time_entry_1' }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual({ id: 'time_entry_1' });
    expect(mockTimeEntriesService.remove).toHaveBeenCalledWith('user_1', 'time_entry_1');
  });

  it('rejects an unauthenticated request with 401', async () => {
    const { UnauthorizedException } = jest.requireActual('@nestjs/common');
    mockRequireUser.mockRejectedValue(new UnauthorizedException());

    const req = new NextRequest('http://localhost/api/time-entries/time_entry_1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'time_entry_1' }) });
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.statusCode).toBe(401);
    expect(mockTimeEntriesService.remove).not.toHaveBeenCalled();
  });
});
