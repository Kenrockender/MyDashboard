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
import { POST } from './route';

const mockRequireUser = requireUser as jest.Mock;
const mockInvoicesService = invoicesService as jest.Mocked<typeof invoicesService>;

describe('POST /api/invoices/[id]/send', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the sent invoice wrapped in the { data } envelope', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });
    mockInvoicesService.send.mockResolvedValue({
      id: 'invoice_1',
      userId: 'user_1',
      projectId: 'project_1',
      clientId: null,
      invoiceNumber: 'INV-2026-0001',
      incomeIds: ['income_1'],
      currency: 'USD',
      subtotal: 500,
      status: 'sent',
      issueDate: new Date(),
      dueDate: null,
      notes: null,
      sentAt: new Date(),
      paidAt: null,
      createdAt: new Date(),
    });

    const req = new NextRequest('http://localhost/api/invoices/invoice_1/send', { method: 'POST' });
    const res = await POST(req, { params: Promise.resolve({ id: 'invoice_1' }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.status).toBe('sent');
    expect(mockInvoicesService.send).toHaveBeenCalledWith('user_1', 'invoice_1');
  });

  it('rejects an unauthenticated request with 401', async () => {
    const { UnauthorizedException } = jest.requireActual('@nestjs/common');
    mockRequireUser.mockRejectedValue(new UnauthorizedException());

    const req = new NextRequest('http://localhost/api/invoices/invoice_1/send', { method: 'POST' });
    const res = await POST(req, { params: Promise.resolve({ id: 'invoice_1' }) });
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.statusCode).toBe(401);
    expect(mockInvoicesService.send).not.toHaveBeenCalled();
  });
});
