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
import { GET, PATCH, DELETE } from './route';

const mockRequireUser = requireUser as jest.Mock;
const mockInvoicesService = invoicesService as jest.Mocked<typeof invoicesService>;

const fixture = {
  id: 'invoice_1',
  userId: 'user_1',
  projectId: 'project_1',
  clientId: null,
  invoiceNumber: 'INV-2026-0001',
  incomeIds: ['income_1'],
  currency: 'USD' as const,
  subtotal: 500,
  status: 'draft' as const,
  issueDate: new Date(),
  dueDate: null,
  notes: null,
  sentAt: null,
  paidAt: null,
  createdAt: new Date(),
};

describe('GET /api/invoices/[id]', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the invoice wrapped in the { data } envelope', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });
    mockInvoicesService.findOne.mockResolvedValue(fixture);

    const req = new NextRequest('http://localhost/api/invoices/invoice_1');
    const res = await GET(req, { params: Promise.resolve({ id: 'invoice_1' }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.id).toBe('invoice_1');
    expect(mockInvoicesService.findOne).toHaveBeenCalledWith('user_1', 'invoice_1');
  });

  it('rejects an unauthenticated request with 401', async () => {
    const { UnauthorizedException } = jest.requireActual('@nestjs/common');
    mockRequireUser.mockRejectedValue(new UnauthorizedException());

    const req = new NextRequest('http://localhost/api/invoices/invoice_1');
    const res = await GET(req, { params: Promise.resolve({ id: 'invoice_1' }) });
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.statusCode).toBe(401);
    expect(mockInvoicesService.findOne).not.toHaveBeenCalled();
  });
});

describe('PATCH /api/invoices/[id]', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the updated invoice wrapped in the { data } envelope', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });
    mockInvoicesService.update.mockResolvedValue({ ...fixture, status: 'paid' });

    const req = new NextRequest('http://localhost/api/invoices/invoice_1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'paid' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'invoice_1' }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.status).toBe('paid');
    expect(mockInvoicesService.update).toHaveBeenCalledWith('user_1', 'invoice_1', { status: 'paid' });
  });

  it('rejects an unauthenticated request with 401', async () => {
    const { UnauthorizedException } = jest.requireActual('@nestjs/common');
    mockRequireUser.mockRejectedValue(new UnauthorizedException());

    const req = new NextRequest('http://localhost/api/invoices/invoice_1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'paid' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'invoice_1' }) });
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.statusCode).toBe(401);
    expect(mockInvoicesService.update).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/invoices/[id]', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the removed id wrapped in the { data } envelope', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });
    mockInvoicesService.remove.mockResolvedValue({ id: 'invoice_1' });

    const req = new NextRequest('http://localhost/api/invoices/invoice_1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'invoice_1' }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual({ id: 'invoice_1' });
    expect(mockInvoicesService.remove).toHaveBeenCalledWith('user_1', 'invoice_1');
  });

  it('rejects an unauthenticated request with 401', async () => {
    const { UnauthorizedException } = jest.requireActual('@nestjs/common');
    mockRequireUser.mockRejectedValue(new UnauthorizedException());

    const req = new NextRequest('http://localhost/api/invoices/invoice_1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'invoice_1' }) });
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.statusCode).toBe(401);
    expect(mockInvoicesService.remove).not.toHaveBeenCalled();
  });
});
