import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { COLLECTIONS, docToEntity } from '../firebase/collections';
import { calculateProfit } from '../common/calculate-profit';
import { calculateMonthlyTrend } from './calculate-monthly-trend';
import { calculateRecentActivity } from './calculate-recent-activity';
import type { Project } from '../projects/projects.service';
import type { Income } from '../income/income.service';
import type { Expense } from '../expenses/expenses.service';

@Injectable()
export class DashboardService {
  constructor(private firebase: FirebaseService) {}

  async getSummary(userId: string) {
    const [projectSnap, incomeSnap, expenseSnap] = await Promise.all([
      this.firebase.db
        .collection(COLLECTIONS.projects)
        .where('userId', '==', userId)
        .get(),
      this.firebase.db
        .collection(COLLECTIONS.income)
        .where('userId', '==', userId)
        .get(),
      this.firebase.db
        .collection(COLLECTIONS.expenses)
        .where('userId', '==', userId)
        .get(),
    ]);

    const projects = projectSnap.docs.map((d) => docToEntity<Project>(d));
    const allIncome = incomeSnap.docs.map((d) => docToEntity<Income>(d));
    const allExpenses = expenseSnap.docs.map((d) => docToEntity<Expense>(d));

    const {
      income: totalRevenue,
      expenses: totalExpenses,
      profit: netProfit,
    } = calculateProfit(allIncome, allExpenses);

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      activeProjects: projects.filter((p) => p.status === 'active').length,
      completedProjects: projects.filter((p) => p.status === 'completed')
        .length,
      monthlyTrend: calculateMonthlyTrend(allIncome, allExpenses),
      recentActivity: calculateRecentActivity(allIncome, allExpenses),
    };
  }
}
