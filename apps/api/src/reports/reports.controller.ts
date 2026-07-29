import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';
import { PdfService } from '../pdf/pdf.service';

@Controller('reports')
export class ReportsController {
  constructor(
    private reportsService: ReportsService,
    private pdfService: PdfService,
  ) {}

  @Get('monthly')
  async monthly(@Query('month') month: string, @CurrentUser() user: AuthUser) {
    return { data: await this.reportsService.getMonthly(user.userId, month) };
  }

  @Get('monthly/pdf')
  async monthlyPdf(
    @Query('month') month: string,
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ) {
    const rows = await this.reportsService.getMonthly(user.userId, month);
    const buffer = await this.pdfService.renderReport('monthly', rows, {
      generatedAt: new Date(),
      contextLabel: month,
    });
    this.sendPdf(res, buffer, `monthly-report-${month}.pdf`);
  }

  @Get('trend')
  async trend(@CurrentUser() user: AuthUser) {
    return { data: await this.reportsService.getMonthlyTrend(user.userId) };
  }

  @Get('trend/pdf')
  async trendPdf(@CurrentUser() user: AuthUser, @Res() res: Response) {
    const rows = await this.reportsService.getMonthlyTrend(user.userId);
    const buffer = await this.pdfService.renderTrend(rows, { generatedAt: new Date() });
    this.sendPdf(res, buffer, 'monthly-trend.pdf');
  }

  @Get('profitability')
  async profitability(@CurrentUser() user: AuthUser) {
    return { data: await this.reportsService.getProfitability(user.userId) };
  }

  @Get('profitability/pdf')
  async profitabilityPdf(@CurrentUser() user: AuthUser, @Res() res: Response) {
    const rows = await this.reportsService.getProfitability(user.userId);
    const buffer = await this.pdfService.renderReport('profitability', rows, {
      generatedAt: new Date(),
    });
    this.sendPdf(res, buffer, 'profitability-report.pdf');
  }

  @Get('expenses')
  async expenses(@CurrentUser() user: AuthUser) {
    return { data: await this.reportsService.getExpenseBreakdown(user.userId) };
  }

  @Get('expenses/pdf')
  async expensesPdf(@CurrentUser() user: AuthUser, @Res() res: Response) {
    const rows = await this.reportsService.getExpenseBreakdown(user.userId);
    const buffer = await this.pdfService.renderReport('expenses', rows, {
      generatedAt: new Date(),
    });
    this.sendPdf(res, buffer, 'expense-breakdown.pdf');
  }

  @Get('revenue')
  async revenue(@CurrentUser() user: AuthUser) {
    return { data: await this.reportsService.getRevenueBreakdown(user.userId) };
  }

  @Get('revenue/pdf')
  async revenuePdf(@CurrentUser() user: AuthUser, @Res() res: Response) {
    const rows = await this.reportsService.getRevenueBreakdown(user.userId);
    const buffer = await this.pdfService.renderReport('revenue', rows, {
      generatedAt: new Date(),
    });
    this.sendPdf(res, buffer, 'revenue-by-client.pdf');
  }

  // The one deliberate exception to this codebase's `{ data }` JSON envelope
  // — a PDF isn't JSON, so these routes bypass Nest's response handling via
  // @Res() and write the binary body directly.
  private sendPdf(res: Response, buffer: Buffer, filename: string) {
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.send(buffer);
  }
}
