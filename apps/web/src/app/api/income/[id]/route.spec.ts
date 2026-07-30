import { NextRequest } from 'next/server';

jest.mock('@/server/require-user', () => ({ requireUser: jest.fn() }));
jest.mock('@/server/income/income.service', () => ({
  incomeService: { create: jest.fn(), findAll: jest.fn(), update: jest.fn(), remove: jest.fn() },
}));

import { requireUser } from '@/server/require-user';
import { incomeService } from '@/server/income/income.service';
import { PATCH, DELETE } from './route';

const mockRequireUser = requireUser as jest.Mock;
const mockIncomeService = incomeService as jest.Mocked<typeof incomeService>;

describe('PATCH /api/income/[id]', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the updated income wrapped in the { data } envelope', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });
    mockIncomeService.update.mockResolvedValue({
      id: 'income_1',
      userId: 'user_1',
      projectId: 'project_1',
      amount: 750,
      currency: 'USD',
      status: 'paid',
      date: new Date(),
      createdAt: new Date(),
    });

    const req = new NextRequest('http://localhost/api/income/income_1', {
      method: 'PATCH',
      body: JSON.stringify({ amount: 750 }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'income_1' }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.amount).toBe(750);
    expect(mockIncomeService.update).toHaveBeenCalledWith('user_1', 'income_1', { amount: 750 });
  });

  it('rejects an unauthenticated request with 401', async () => {
    const { UnauthorizedException } = jest.requireActual('@nestjs/common');
    mockRequireUser.mockRejectedValue(new UnauthorizedException());

    const req = new NextRequest('http://localhost/api/income/income_1', {
      method: 'PATCH',
      body: JSON.stringify({ amount: 750 }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'income_1' }) });
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.statusCode).toBe(401);
    expect(mockIncomeService.update).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/income/[id]', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the removed id wrapped in the { data } envelope', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });
    mockIncomeService.remove.mockResolvedValue({ id: 'income_1' });

    const req = new NextRequest('http://localhost/api/income/income_1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'income_1' }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual({ id: 'income_1' });
    expect(mockIncomeService.remove).toHaveBeenCalledWith('user_1', 'income_1');
  });

  it('rejects an unauthenticated request with 401', async () => {
    const { UnauthorizedException } = jest.requireActual('@nestjs/common');
    mockRequireUser.mockRejectedValue(new UnauthorizedException());

    const req = new NextRequest('http://localhost/api/income/income_1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'income_1' }) });
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.statusCode).toBe(401);
    expect(mockIncomeService.remove).not.toHaveBeenCalled();
  });
});
