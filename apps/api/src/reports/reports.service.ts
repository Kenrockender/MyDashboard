import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { calculateProfit } from '../common/calculate-profit';
import { monthKey } from '../dashboard/calculate-monthly-trend';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  private async getAllRecords(userId: string) {
    const projects = await this.prisma.project.findMany({
      where: { userId },
      include: { income: true, expenses: true },
    });
    return {
      income: projects.flatMap((p) => p.income),
      expenses: projects.flatMap((p) => p.expenses),
    };
  }

  async getMonthly(userId: string, month: string) {
    const { income, expenses } = await this.getAllRecords(userId);
    const monthIncome = income.filter((i) => monthKey(i.date) === month);
    const monthExpenses = expenses.filter((e) => monthKey(e.date) === month);
    const totals = calculateProfit(monthIncome, monthExpenses);
    return { month, revenue: totals.income, expenses: totals.expenses, profit: totals.profit };
  }

  async getProfitability(userId: string) {
    const projects = await this.prisma.project.findMany({
      where: { userId },
      include: { income: true, expenses: true },
    });

    return projects
      .map((p) => {
        const totals = calculateProfit(p.income, p.expenses);
        const margin = totals.income > 0 ? totals.profit / totals.income : 0;
        return {
          projectId: p.id,
          name: p.name,
          income: totals.income,
          expenses: totals.expenses,
          profit: totals.profit,
          margin,
        };
      })
      .sort((a, b) => b.profit - a.profit);
  }

  async getExpenseBreakdown(userId: string) {
    const { expenses } = await this.getAllRecords(userId);
    const groups = new Map<string, number>();
    for (const e of expenses) {
      groups.set(e.category, (groups.get(e.category) ?? 0) + Number(e.amount));
    }
    return [...groups.entries()]
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }

  async getRevenueBreakdown(userId: string) {
    const projects = await this.prisma.project.findMany({
      where: { userId },
      include: { income: true, client: true },
    });

    const groups = new Map<string, { clientId: string | null; clientName: string; total: number }>();
    for (const p of projects) {
      const key = p.clientId ?? 'none';
      const projectTotal = p.income.reduce((sum, i) => sum + Number(i.amount), 0);
      const entry = groups.get(key) ?? { clientId: p.clientId, clientName: p.client?.name ?? 'No client', total: 0 };
      entry.total += projectTotal;
      groups.set(key, entry);
    }

    return [...groups.values()].sort((a, b) => b.total - a.total);
  }
}
