import { NextRequest } from 'next/server';

jest.mock('@/server/require-user', () => ({ requireUser: jest.fn() }));
jest.mock('@/server/expenses/expenses.service', () => ({
  expensesService: { create: jest.fn(), findAll: jest.fn(), update: jest.fn(), remove: jest.fn() },
}));

import { requireUser } from '@/server/require-user';
import { expensesService } from '@/server/expenses/expenses.service';
import { PATCH, DELETE } from './route';

const mockRequireUser = requireUser as jest.Mock;
const mockExpensesService = expensesService as jest.Mocked<typeof expensesService>;

describe('PATCH /api/expenses/[id]', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the updated expense wrapped in the { data } envelope', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });
    mockExpensesService.update.mockResolvedValue({
      id: 'expense_1',
      userId: 'user_1',
      projectId: 'project_1',
      amount: 50,
      currency: 'USD',
      category: 'domain',
      date: new Date(),
      createdAt: new Date(),
    });

    const req = new NextRequest('http://localhost/api/expenses/expense_1', {
      method: 'PATCH',
      body: JSON.stringify({ amount: 50 }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'expense_1' }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.amount).toBe(50);
    expect(mockExpensesService.update).toHaveBeenCalledWith('user_1', 'expense_1', { amount: 50 });
  });

  it('rejects an unauthenticated request with 401', async () => {
    const { UnauthorizedException } = jest.requireActual('@nestjs/common');
    mockRequireUser.mockRejectedValue(new UnauthorizedException());

    const req = new NextRequest('http://localhost/api/expenses/expense_1', {
      method: 'PATCH',
      body: JSON.stringify({ amount: 50 }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'expense_1' }) });
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.statusCode).toBe(401);
    expect(mockExpensesService.update).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/expenses/[id]', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the removed id wrapped in the { data } envelope', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });
    mockExpensesService.remove.mockResolvedValue({ id: 'expense_1' });

    const req = new NextRequest('http://localhost/api/expenses/expense_1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'expense_1' }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual({ id: 'expense_1' });
    expect(mockExpensesService.remove).toHaveBeenCalledWith('user_1', 'expense_1');
  });

  it('rejects an unauthenticated request with 401', async () => {
    const { UnauthorizedException } = jest.requireActual('@nestjs/common');
    mockRequireUser.mockRejectedValue(new UnauthorizedException());

    const req = new NextRequest('http://localhost/api/expenses/expense_1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'expense_1' }) });
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.statusCode).toBe(401);
    expect(mockExpensesService.remove).not.toHaveBeenCalled();
  });
});
