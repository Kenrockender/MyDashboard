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
import { GET, POST } from './route';

const mockRequireUser = requireUser as jest.Mock;
const mockTimeEntriesService = timeEntriesService as jest.Mocked<typeof timeEntriesService>;

describe('POST /api/projects/[id]/time-entries', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the created time entry wrapped in the { data } envelope', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });
    mockTimeEntriesService.create.mockResolvedValue({
      id: 'time_1',
      userId: 'user_1',
      projectId: 'project_1',
      hours: 2,
      date: new Date(),
      currency: 'USD',
      status: 'unlogged',
      createdAt: new Date(),
    });

    const req = new NextRequest('http://localhost/api/projects/project_1/time-entries', {
      method: 'POST',
      body: JSON.stringify({ hours: 2, date: '2026-07-01' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'project_1' }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.hours).toBe(2);
    expect(mockTimeEntriesService.create).toHaveBeenCalledWith('user_1', 'project_1', {
      hours: 2,
      date: '2026-07-01',
    });
  });

  it('rejects an unauthenticated request with 401', async () => {
    const { UnauthorizedException } = jest.requireActual('@nestjs/common');
    mockRequireUser.mockRejectedValue(new UnauthorizedException());

    const req = new NextRequest('http://localhost/api/projects/project_1/time-entries', {
      method: 'POST',
      body: JSON.stringify({ hours: 2, date: '2026-07-01' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'project_1' }) });
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.statusCode).toBe(401);
    expect(mockTimeEntriesService.create).not.toHaveBeenCalled();
  });

  it('rejects an invalid body with 400', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });

    const req = new NextRequest('http://localhost/api/projects/project_1/time-entries', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'project_1' }) });

    expect(res.status).toBe(400);
    expect(mockTimeEntriesService.create).not.toHaveBeenCalled();
  });
});

describe('GET /api/projects/[id]/time-entries', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the list wrapped in the { data } envelope', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });
    mockTimeEntriesService.findAll.mockResolvedValue([]);

    const req = new NextRequest('http://localhost/api/projects/project_1/time-entries');
    const res = await GET(req, { params: Promise.resolve({ id: 'project_1' }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual([]);
    expect(mockTimeEntriesService.findAll).toHaveBeenCalledWith('user_1', 'project_1');
  });
});
