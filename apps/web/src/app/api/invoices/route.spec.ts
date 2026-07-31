import { NextRequest } from 'next/server';

jest.mock('@/server/require-user', () => ({ requireUser: jest.fn() }));
jest.mock('@/server/invoices/invoices.service', () => ({
  invoicesService: {
    create: jest.fn(),
    findAllForProject: jest.fn(),
    findAllForUser: jest.fn(),
    findOne: jest.fn(),
    getPdfData: jest.fn(),
    update: jest.fn(),
    send: jest.fn(),
    remove: jest.fn(),
  },
}));
jest.mock('@/server/clients/clients.service', () => ({
  clientsService: { findAll: jest.fn() },
}));

import { requireUser } from '@/server/require-user';
import { invoicesService } from '@/server/invoices/invoices.service';
import { clientsService } from '@/server/clients/clients.service';
import { GET } from './route';

const mockRequireUser = requireUser as jest.Mock;
const mockInvoicesService = invoicesService as jest.Mocked<typeof invoicesService>;
const mockClientsService = clientsService as jest.Mocked<typeof clientsService>;

describe('GET /api/invoices', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the page wrapped in the { data } envelope, passing through ?status', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });
    mockInvoicesService.findAllForUser.mockResolvedValue({ items: [], nextCursor: null });

    const req = new NextRequest('http://localhost/api/invoices?status=sent');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual({ items: [], nextCursor: null });
    expect(mockInvoicesService.findAllForUser).toHaveBeenCalledWith(
      'user_1',
      { status: 'sent', search: undefined, matchingClientIds: undefined },
      { cursor: undefined, limit: undefined },
    );
    expect(mockClientsService.findAll).not.toHaveBeenCalled();
  });

  it('resolves matching client ids and passes cursor/limit when searching', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });
    mockClientsService.findAll.mockResolvedValue({
      items: [{ id: 'client_1' }, { id: 'client_2' }] as never,
      nextCursor: null,
    });
    mockInvoicesService.findAllForUser.mockResolvedValue({ items: [], nextCursor: null });

    const req = new NextRequest('http://localhost/api/invoices?search=acme&cursor=2026-01-01T00:00:00.000Z&limit=10');
    await GET(req);

    expect(mockClientsService.findAll).toHaveBeenCalledWith('user_1', 'acme', {
      limit: Number.MAX_SAFE_INTEGER,
    });
    expect(mockInvoicesService.findAllForUser).toHaveBeenCalledWith(
      'user_1',
      { status: undefined, search: 'acme', matchingClientIds: ['client_1', 'client_2'] },
      { cursor: '2026-01-01T00:00:00.000Z', limit: 10 },
    );
  });

  it('rejects an unauthenticated request with 401', async () => {
    const { UnauthorizedException } = jest.requireActual('@nestjs/common');
    mockRequireUser.mockRejectedValue(new UnauthorizedException());

    const req = new NextRequest('http://localhost/api/invoices');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.statusCode).toBe(401);
    expect(mockInvoicesService.findAllForUser).not.toHaveBeenCalled();
  });
});
