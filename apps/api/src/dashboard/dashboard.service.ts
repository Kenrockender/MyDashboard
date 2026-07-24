import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { calculateProfit } from '../common/calculate-profit';
import { calculateMonthlyTrend } from './calculate-monthly-trend';
import { calculateRecentActivity } from './calculate-recent-activity';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getSummary(userId: string) {
    const projects = await this.prisma.project.findMany({
      where: { userId },
      include: { income: true, expenses: true },
    });

    const activeProjects = projects.filter((p) => p.status === 'active').length;
    const completedProjects = projects.filter((p) => p.status === 'completed').length;

    const allIncome = projects.flatMap((p) => p.income.map((i) => ({ ...i, projectId: p.id })));
    const allExpenses = projects.flatMap((p) => p.expenses.map((e) => ({ ...e, projectId: p.id })));

    const { income: totalRevenue, expenses: totalExpenses, profit: netProfit } = calculateProfit(allIncome, allExpenses);

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      activeProjects,
      completedProjects,
      monthlyTrend: calculateMonthlyTrend(allIncome, allExpenses),
      recentActivity: calculateRecentActivity(allIncome, allExpenses),
    };
  }
}
