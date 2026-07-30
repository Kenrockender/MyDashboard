import { db } from '../firebase';
import { COLLECTIONS, docToEntity } from '../collections';
import { calculateProfit } from '../common/calculate-profit';
import { calculateMonthlyTrend } from './calculate-monthly-trend';
import { calculateRecentActivity } from './calculate-recent-activity';
import type { Project } from '../projects/projects.service';
import type { Income } from '../income/income.service';
import type { Expense } from '../expenses/expenses.service';

class DashboardService {
  async getSummary(userId: string) {
    const [projectSnap, incomeSnap, expenseSnap] = await Promise.all([
      db.collection(COLLECTIONS.projects).where('userId', '==', userId).get(),
      db.collection(COLLECTIONS.income).where('userId', '==', userId).get(),
      db.collection(COLLECTIONS.expenses).where('userId', '==', userId).get(),
    ]);

    const projects = projectSnap.docs.map((d) => docToEntity<Project>(d));
    const allIncome = incomeSnap.docs.map((d) => docToEntity<Income>(d));
    const allExpenses = expenseSnap.docs.map((d) => docToEntity<Expense>(d));

    return {
      totals: calculateProfit(allIncome, allExpenses),
      activeProjects: projects.filter((p) => p.status === 'active').length,
      completedProjects: projects.filter((p) => p.status === 'completed')
        .length,
      monthlyTrend: calculateMonthlyTrend(allIncome, allExpenses),
      recentActivity: calculateRecentActivity(allIncome, allExpenses),
    };
  }
}

export const dashboardService = new DashboardService();
