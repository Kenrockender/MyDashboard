import { NextRequest } from 'next/server';

jest.mock('@/server/require-user', () => ({ requireUser: jest.fn() }));
jest.mock('@/server/invoices/invoices.service', () => ({
  invoicesService: {
    create: jest.fn(),
    findAllForProject: jest.fn(),
    findAllForUser: jest.fn(),
    findOne: jest.fn(),
    getDetail: jest.fn(),
    update: jest.fn(),
    send: jest.fn(),
    remove: jest.fn(),
  },
}));
jest.mock('@/server/pdf/pdf.service', () => ({
  pdfService: { renderInvoice: jest.fn(), renderReport: jest.fn(), renderTrend: jest.fn() },
}));

import { requireUser } from '@/server/require-user';
import { invoicesService } from '@/server/invoices/invoices.service';
import { pdfService } from '@/server/pdf/pdf.service';
import { GET } from './route';

const mockRequireUser = requireUser as jest.Mock;
const mockInvoicesService = invoicesService as jest.Mocked<typeof invoicesService>;
const mockPdfService = pdfService as jest.Mocked<typeof pdfService>;

describe('GET /api/invoices/[id]/pdf', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns a PDF response wired to the invoice PDF data', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });
    mockInvoicesService.getDetail.mockResolvedValue({
      invoice: { id: 'invoice_1', invoiceNumber: 'INV-2026-0001' } as never,
      project: { id: 'project_1' } as never,
      client: null,
      incomeLines: [],
    });
    mockPdfService.renderInvoice.mockResolvedValue(Buffer.from('fake-pdf'));

    const req = new NextRequest('http://localhost/api/invoices/invoice_1/pdf');
    const res = await GET(req, { params: Promise.resolve({ id: 'invoice_1' }) });

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
    expect(mockInvoicesService.getDetail).toHaveBeenCalledWith('user_1', 'invoice_1');
    expect(mockPdfService.renderInvoice).toHaveBeenCalled();
  });

  it('rejects an unauthenticated request with 401', async () => {
    const { UnauthorizedException } = jest.requireActual('@nestjs/common');
    mockRequireUser.mockRejectedValue(new UnauthorizedException());

    const req = new NextRequest('http://localhost/api/invoices/invoice_1/pdf');
    const res = await GET(req, { params: Promise.resolve({ id: 'invoice_1' }) });
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.statusCode).toBe(401);
    expect(mockInvoicesService.getDetail).not.toHaveBeenCalled();
  });
});
