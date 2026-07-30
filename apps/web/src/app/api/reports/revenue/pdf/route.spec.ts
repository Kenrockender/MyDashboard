import { NextRequest } from 'next/server';

jest.mock('@/server/require-user', () => ({ requireUser: jest.fn() }));
jest.mock('@/server/reports/reports.service', () => ({
  reportsService: {
    getMonthly: jest.fn(),
    getMonthlyTrend: jest.fn(),
    getProfitability: jest.fn(),
    getExpenseBreakdown: jest.fn(),
    getRevenueBreakdown: jest.fn(),
  },
}));
jest.mock('@/server/pdf/pdf.service', () => ({
  pdfService: { renderInvoice: jest.fn(), renderReport: jest.fn(), renderTrend: jest.fn() },
}));

import { requireUser } from '@/server/require-user';
import { reportsService } from '@/server/reports/reports.service';
import { pdfService } from '@/server/pdf/pdf.service';
import { GET } from './route';

const mockRequireUser = requireUser as jest.Mock;
const mockReportsService = reportsService as jest.Mocked<typeof reportsService>;
const mockPdfService = pdfService as jest.Mocked<typeof pdfService>;

describe('GET /api/reports/revenue/pdf', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns a PDF response wired to the revenue breakdown data', async () => {
    mockRequireUser.mockResolvedValue({ userId: 'user_1' });
    mockReportsService.getRevenueBreakdown.mockResolvedValue([]);
    mockPdfService.renderReport.mockResolvedValue(Buffer.from('fake-pdf'));

    const req = new NextRequest('http://localhost/api/reports/revenue/pdf');
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
    expect(mockReportsService.getRevenueBreakdown).toHaveBeenCalledWith('user_1');
    expect(mockPdfService.renderReport).toHaveBeenCalledWith('revenue', [], expect.any(Object));
  });

  it('rejects an unauthenticated request with 401', async () => {
    const { UnauthorizedException } = jest.requireActual('@nestjs/common');
    mockRequireUser.mockRejectedValue(new UnauthorizedException());

    const req = new NextRequest('http://localhost/api/reports/revenue/pdf');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.statusCode).toBe(401);
    expect(mockReportsService.getRevenueBreakdown).not.toHaveBeenCalled();
  });
});
