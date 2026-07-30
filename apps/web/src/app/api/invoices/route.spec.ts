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

import { requireUser } from '@/server/require-user';
import { invoicesService } from '@/server/invoices/invoices.service';
import { GET } from './route';

const mockRequireUser = requireUser as jest.Mock;
const mockInvoicesService = invoicesService as jest.Mocked<typeof invoicesService>;

describe('GET /api/invoices', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the list wrapped in the { data } envelope, passing through ?status', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });
    mockInvoicesService.findAllForUser.mockResolvedValue([]);

    const req = new NextRequest('http://localhost/api/invoices?status=sent');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual([]);
    expect(mockInvoicesService.findAllForUser).toHaveBeenCalledWith('user_1', 'sent');
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
