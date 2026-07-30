import { NextRequest } from 'next/server';

jest.mock('@/server/require-user', () => ({ requireUser: jest.fn() }));
jest.mock('@/server/invoices/invoices.service', () => ({
  invoicesService: {
    create: jest.fn(),
    findAllForProject: jest.fn(),
    findAllForUser: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    send: jest.fn(),
    remove: jest.fn(),
    getPdfData: jest.fn(),
  },
}));

import { requireUser } from '@/server/require-user';
import { invoicesService } from '@/server/invoices/invoices.service';
import { GET, POST } from './route';

const mockRequireUser = requireUser as jest.Mock;
const mockInvoicesService = invoicesService as jest.Mocked<typeof invoicesService>;

describe('POST /api/projects/[id]/invoices', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the created invoice wrapped in the { data } envelope', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });
    mockInvoicesService.create.mockResolvedValue({
      id: 'invoice_1',
      userId: 'user_1',
      projectId: 'project_1',
      clientId: null,
      invoiceNumber: 'INV-2026-0001',
      incomeIds: ['income_1'],
      currency: 'USD',
      subtotal: 1000,
      status: 'draft',
      issueDate: new Date(),
      dueDate: null,
      notes: null,
      sentAt: null,
      paidAt: null,
      createdAt: new Date(),
    });

    const req = new NextRequest('http://localhost/api/projects/project_1/invoices', {
      method: 'POST',
      body: JSON.stringify({ incomeIds: ['income_1'] }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'project_1' }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.invoiceNumber).toBe('INV-2026-0001');
    expect(mockInvoicesService.create).toHaveBeenCalledWith('user_1', 'project_1', {
      incomeIds: ['income_1'],
    });
  });

  it('rejects an unauthenticated request with 401', async () => {
    const { UnauthorizedException } = jest.requireActual('@nestjs/common');
    mockRequireUser.mockRejectedValue(new UnauthorizedException());

    const req = new NextRequest('http://localhost/api/projects/project_1/invoices', {
      method: 'POST',
      body: JSON.stringify({ incomeIds: ['income_1'] }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'project_1' }) });
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.statusCode).toBe(401);
    expect(mockInvoicesService.create).not.toHaveBeenCalled();
  });

  it('rejects an invalid body with 400', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });

    const req = new NextRequest('http://localhost/api/projects/project_1/invoices', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'project_1' }) });

    expect(res.status).toBe(400);
    expect(mockInvoicesService.create).not.toHaveBeenCalled();
  });
});

describe('GET /api/projects/[id]/invoices', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the list wrapped in the { data } envelope', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });
    mockInvoicesService.findAllForProject.mockResolvedValue([]);

    const req = new NextRequest('http://localhost/api/projects/project_1/invoices');
    const res = await GET(req, { params: Promise.resolve({ id: 'project_1' }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual([]);
    expect(mockInvoicesService.findAllForProject).toHaveBeenCalledWith('user_1', 'project_1');
  });
});
