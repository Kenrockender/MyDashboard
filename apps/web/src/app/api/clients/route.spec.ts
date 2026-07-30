import { NextRequest } from 'next/server';

// Factory mocks (not bare `jest.mock(path)` automocks) — automocking still
// evaluates the real module first to learn its shape, which would run
// require-user.ts's/clients.service.ts's top-level `import { db, auth } from
// '../firebase'` and try to initialize the real Firebase Admin SDK.
jest.mock('@/server/require-user', () => ({ requireUser: jest.fn() }));
jest.mock('@/server/clients/clients.service', () => ({
  clientsService: { create: jest.fn(), findAll: jest.fn(), findOne: jest.fn(), update: jest.fn() },
}));

import { requireUser } from '@/server/require-user';
import { clientsService } from '@/server/clients/clients.service';
import { GET, POST } from './route';

const mockRequireUser = requireUser as jest.Mock;
const mockClientsService = clientsService as jest.Mocked<typeof clientsService>;

describe('POST /api/clients', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the created client wrapped in the { data } envelope', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });
    mockClientsService.create.mockResolvedValue({
      id: 'client_1',
      userId: 'user_1',
      name: 'Acme Corp',
      createdAt: new Date(),
    });

    const req = new NextRequest('http://localhost/api/clients', {
      method: 'POST',
      body: JSON.stringify({ name: 'Acme Corp' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.name).toBe('Acme Corp');
    expect(mockClientsService.create).toHaveBeenCalledWith('user_1', { name: 'Acme Corp' });
  });

  it('rejects an unauthenticated request with 401', async () => {
    const { UnauthorizedException } = jest.requireActual('@nestjs/common');
    mockRequireUser.mockRejectedValue(new UnauthorizedException());

    const req = new NextRequest('http://localhost/api/clients', {
      method: 'POST',
      body: JSON.stringify({ name: 'Acme Corp' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.statusCode).toBe(401);
    expect(mockClientsService.create).not.toHaveBeenCalled();
  });

  it('rejects an invalid body with 400', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });

    const req = new NextRequest('http://localhost/api/clients', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(mockClientsService.create).not.toHaveBeenCalled();
  });
});

describe('GET /api/clients', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the list wrapped in the { data } envelope, passing through ?search', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });
    mockClientsService.findAll.mockResolvedValue([]);

    const req = new NextRequest('http://localhost/api/clients?search=acme');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual([]);
    expect(mockClientsService.findAll).toHaveBeenCalledWith('user_1', 'acme');
  });
});
