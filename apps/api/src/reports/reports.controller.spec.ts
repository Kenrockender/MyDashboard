import { Test } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { PdfService } from '../pdf/pdf.service';

describe('ReportsController', () => {
  let controller: ReportsController;
  const mockService = {
    getMonthly: jest
      .fn()
      .mockResolvedValue([{ month: '2026-06', currency: 'USD', revenue: 1, expenses: 0, profit: 1 }]),
    getMonthlyTrend: jest.fn().mockResolvedValue([]),
    getProfitability: jest.fn().mockResolvedValue([]),
    getExpenseBreakdown: jest.fn().mockResolvedValue([]),
    getRevenueBreakdown: jest.fn().mockResolvedValue([]),
  };
  const mockPdfService = {
    renderReport: jest.fn().mockResolvedValue(Buffer.from('%PDF-1.7 fake')),
    renderTrend: jest.fn().mockResolvedValue(Buffer.from('%PDF-1.7 fake')),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        { provide: ReportsService, useValue: mockService },
        { provide: PdfService, useValue: mockPdfService },
      ],
    }).compile();
    controller = module.get(ReportsController);
    jest.clearAllMocks();
  });

  function fakeResponse() {
    return { set: jest.fn(), send: jest.fn() } as any;
  }

  it('streams a PDF for the monthly report', async () => {
    const res = fakeResponse();
    mockService.getMonthly.mockResolvedValue([
      { month: '2026-06', currency: 'USD', revenue: 1, expenses: 0, profit: 1 },
    ]);
    await controller.monthlyPdf('2026-06', { userId: 'user_1' }, res);

    expect(mockService.getMonthly).toHaveBeenCalledWith('user_1', '2026-06');
    expect(mockPdfService.renderReport).toHaveBeenCalledWith(
      'monthly',
      [{ month: '2026-06', currency: 'USD', revenue: 1, expenses: 0, profit: 1 }],
      expect.objectContaining({ contextLabel: '2026-06' }),
    );
    expect(res.set).toHaveBeenCalledWith(
      expect.objectContaining({ 'Content-Type': 'application/pdf' }),
    );
    expect(res.send).toHaveBeenCalledWith(Buffer.from('%PDF-1.7 fake'));
  });

  it('streams a PDF for the monthly trend', async () => {
    const res = fakeResponse();
    await controller.trendPdf({ userId: 'user_1' }, res);

    expect(mockService.getMonthlyTrend).toHaveBeenCalledWith('user_1');
    expect(mockPdfService.renderReport).not.toHaveBeenCalled();
    expect(res.send).toHaveBeenCalled();
  });

  it('streams a PDF for the profitability report', async () => {
    const res = fakeResponse();
    await controller.profitabilityPdf({ userId: 'user_1' }, res);

    expect(mockService.getProfitability).toHaveBeenCalledWith('user_1');
    expect(mockPdfService.renderReport).toHaveBeenCalledWith(
      'profitability',
      [],
      expect.any(Object),
    );
    expect(res.send).toHaveBeenCalled();
  });

  it('streams a PDF for the expense breakdown', async () => {
    const res = fakeResponse();
    await controller.expensesPdf({ userId: 'user_1' }, res);

    expect(mockService.getExpenseBreakdown).toHaveBeenCalledWith('user_1');
    expect(mockPdfService.renderReport).toHaveBeenCalledWith('expenses', [], expect.any(Object));
    expect(res.send).toHaveBeenCalled();
  });

  it('streams a PDF for the revenue-by-client report', async () => {
    const res = fakeResponse();
    await controller.revenuePdf({ userId: 'user_1' }, res);

    expect(mockService.getRevenueBreakdown).toHaveBeenCalledWith('user_1');
    expect(mockPdfService.renderReport).toHaveBeenCalledWith('revenue', [], expect.any(Object));
    expect(res.send).toHaveBeenCalled();
  });
});
