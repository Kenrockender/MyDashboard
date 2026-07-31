import { NextRequest } from 'next/server';

jest.mock('@/server/require-user', () => ({ requireUser: jest.fn() }));
jest.mock('@/server/clients/clients.service', () => ({
  clientsService: { findOne: jest.fn(), update: jest.fn() },
}));

import { requireUser } from '@/server/require-user';
import { clientsService } from '@/server/clients/clients.service';
import { GET, PATCH } from './route';

const mockRequireUser = requireUser as jest.Mock;
const mockClientsService = clientsService as jest.Mocked<typeof clientsService>;

describe('GET /api/clients/[id]', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the client wrapped in the { data } envelope', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });
    mockClientsService.findOne.mockResolvedValue({
      id: 'client_1',
      userId: 'user_1',
      name: 'Kopi Kita',
      createdAt: new Date(),
      projects: [],
    } as never);

    const req = new NextRequest('http://localhost/api/clients/client_1');
    const res = await GET(req, { params: Promise.resolve({ id: 'client_1' }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.id).toBe('client_1');
    expect(mockClientsService.findOne).toHaveBeenCalledWith('user_1', 'client_1');
  });

  it('rejects an unauthenticated request with 401', async () => {
    const { UnauthorizedException } = jest.requireActual('@nestjs/common');
    mockRequireUser.mockRejectedValue(new UnauthorizedException());

    const req = new NextRequest('http://localhost/api/clients/client_1');
    const res = await GET(req, { params: Promise.resolve({ id: 'client_1' }) });
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.statusCode).toBe(401);
    expect(mockClientsService.findOne).not.toHaveBeenCalled();
  });
});

describe('PATCH /api/clients/[id]', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the updated client wrapped in the { data } envelope', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });
    mockClientsService.update.mockResolvedValue({
      id: 'client_1',
      userId: 'user_1',
      name: 'Kopi Kita Roastery',
      createdAt: new Date(),
    });

    const req = new NextRequest('http://localhost/api/clients/client_1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Kopi Kita Roastery' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'client_1' }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.name).toBe('Kopi Kita Roastery');
    expect(mockClientsService.update).toHaveBeenCalledWith('user_1', 'client_1', {
      name: 'Kopi Kita Roastery',
    });
  });

  it('rejects an unauthenticated request with 401', async () => {
    const { UnauthorizedException } = jest.requireActual('@nestjs/common');
    mockRequireUser.mockRejectedValue(new UnauthorizedException());

    const req = new NextRequest('http://localhost/api/clients/client_1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Kopi Kita Roastery' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'client_1' }) });
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.statusCode).toBe(401);
    expect(mockClientsService.update).not.toHaveBeenCalled();
  });

  it('rejects a PATCH body with fields outside the DTO whitelist with 400', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });

    const req = new NextRequest('http://localhost/api/clients/client_1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Kopi Kita Roastery', userId: 'attacker-uid' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'client_1' }) });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.statusCode).toBe(400);
    expect(mockClientsService.update).not.toHaveBeenCalled();
  });
});
