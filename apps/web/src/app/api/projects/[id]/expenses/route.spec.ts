import { NextRequest } from 'next/server';

jest.mock('@/server/require-user', () => ({ requireUser: jest.fn() }));
jest.mock('@/server/expenses/expenses.service', () => ({
  expensesService: { create: jest.fn(), findAll: jest.fn(), update: jest.fn(), remove: jest.fn() },
}));

import { requireUser } from '@/server/require-user';
import { expensesService } from '@/server/expenses/expenses.service';
import { GET, POST } from './route';

const mockRequireUser = requireUser as jest.Mock;
const mockExpensesService = expensesService as jest.Mocked<typeof expensesService>;

describe('POST /api/projects/[id]/expenses', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the created expense wrapped in the { data } envelope', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });
    mockExpensesService.create.mockResolvedValue({
      id: 'expense_1',
      userId: 'user_1',
      projectId: 'project_1',
      amount: 50,
      currency: 'USD',
      category: 'domain',
      date: new Date(),
      createdAt: new Date(),
    });

    const req = new NextRequest('http://localhost/api/projects/project_1/expenses', {
      method: 'POST',
      body: JSON.stringify({ amount: 50, category: 'domain', date: '2026-07-01' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'project_1' }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.amount).toBe(50);
    expect(mockExpensesService.create).toHaveBeenCalledWith('user_1', 'project_1', {
      amount: 50,
      category: 'domain',
      date: '2026-07-01',
    });
  });

  it('rejects an unauthenticated request with 401', async () => {
    const { UnauthorizedException } = jest.requireActual('@nestjs/common');
    mockRequireUser.mockRejectedValue(new UnauthorizedException());

    const req = new NextRequest('http://localhost/api/projects/project_1/expenses', {
      method: 'POST',
      body: JSON.stringify({ amount: 50, category: 'domain', date: '2026-07-01' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'project_1' }) });
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.statusCode).toBe(401);
    expect(mockExpensesService.create).not.toHaveBeenCalled();
  });

  it('rejects an invalid body with 400', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });

    const req = new NextRequest('http://localhost/api/projects/project_1/expenses', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'project_1' }) });

    expect(res.status).toBe(400);
    expect(mockExpensesService.create).not.toHaveBeenCalled();
  });
});

describe('GET /api/projects/[id]/expenses', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the list wrapped in the { data } envelope', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });
    mockExpensesService.findAll.mockResolvedValue([]);

    const req = new NextRequest('http://localhost/api/projects/project_1/expenses');
    const res = await GET(req, { params: Promise.resolve({ id: 'project_1' }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual([]);
    expect(mockExpensesService.findAll).toHaveBeenCalledWith('user_1', 'project_1');
  });
});
