import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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

    const totalRevenue = allIncome.reduce((sum, i) => sum + Number(i.amount), 0);
    const totalExpenses = allExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

    return {
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      activeProjects,
      completedProjects,
      monthlyTrend: calculateMonthlyTrend(allIncome, allExpenses),
      recentActivity: calculateRecentActivity(allIncome, allExpenses),
    };
  }
}
