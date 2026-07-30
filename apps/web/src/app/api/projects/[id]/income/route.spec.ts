import { NextRequest } from 'next/server';

jest.mock('@/server/require-user', () => ({ requireUser: jest.fn() }));
jest.mock('@/server/income/income.service', () => ({
  incomeService: { create: jest.fn(), findAll: jest.fn(), update: jest.fn(), remove: jest.fn() },
}));

import { requireUser } from '@/server/require-user';
import { incomeService } from '@/server/income/income.service';
import { GET, POST } from './route';

const mockRequireUser = requireUser as jest.Mock;
const mockIncomeService = incomeService as jest.Mocked<typeof incomeService>;

describe('POST /api/projects/[id]/income', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the created income record wrapped in the { data } envelope', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });
    mockIncomeService.create.mockResolvedValue({
      id: 'income_1',
      userId: 'user_1',
      projectId: 'project_1',
      amount: 1000,
      currency: 'USD',
      status: 'pending',
      date: new Date(),
      createdAt: new Date(),
    });

    const req = new NextRequest('http://localhost/api/projects/project_1/income', {
      method: 'POST',
      body: JSON.stringify({ amount: 1000, date: '2026-07-01' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'project_1' }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.amount).toBe(1000);
    expect(mockIncomeService.create).toHaveBeenCalledWith('user_1', 'project_1', {
      amount: 1000,
      date: '2026-07-01',
    });
  });

  it('rejects an unauthenticated request with 401', async () => {
    const { UnauthorizedException } = jest.requireActual('@nestjs/common');
    mockRequireUser.mockRejectedValue(new UnauthorizedException());

    const req = new NextRequest('http://localhost/api/projects/project_1/income', {
      method: 'POST',
      body: JSON.stringify({ amount: 1000, date: '2026-07-01' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'project_1' }) });
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.statusCode).toBe(401);
    expect(mockIncomeService.create).not.toHaveBeenCalled();
  });

  it('rejects an invalid body with 400', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });

    const req = new NextRequest('http://localhost/api/projects/project_1/income', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'project_1' }) });

    expect(res.status).toBe(400);
    expect(mockIncomeService.create).not.toHaveBeenCalled();
  });
});

describe('GET /api/projects/[id]/income', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the list wrapped in the { data } envelope', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });
    mockIncomeService.findAll.mockResolvedValue([]);

    const req = new NextRequest('http://localhost/api/projects/project_1/income');
    const res = await GET(req, { params: Promise.resolve({ id: 'project_1' }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual([]);
    expect(mockIncomeService.findAll).toHaveBeenCalledWith('user_1', 'project_1');
  });
});
