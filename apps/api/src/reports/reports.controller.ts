import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';

@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('monthly')
  async monthly(@Query('month') month: string, @CurrentUser() user: AuthUser) {
    return { data: await this.reportsService.getMonthly(user.userId, month) };
  }

  @Get('profitability')
  async profitability(@CurrentUser() user: AuthUser) {
    return { data: await this.reportsService.getProfitability(user.userId) };
  }

  @Get('expenses')
  async expenses(@CurrentUser() user: AuthUser) {
    return { data: await this.reportsService.getExpenseBreakdown(user.userId) };
  }

  @Get('revenue')
  async revenue(@CurrentUser() user: AuthUser) {
    return { data: await this.reportsService.getRevenueBreakdown(user.userId) };
  }
}
