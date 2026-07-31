import { db } from '../firebase';
import { COLLECTIONS, docToEntity } from '../collections';
import {
  calculateOverdueIncome,
  totalsByCurrency,
  type OverdueIncomeEntry,
} from './calculate-overdue-income';
import {
  calculateUpcomingRecurringExpenses,
  type UpcomingRecurringExpenseEntry,
} from './calculate-upcoming-recurring-expenses';
import type { Project } from '../projects/projects.service';
import type { Income } from '../income/income.service';
import type { Expense } from '../expenses/expenses.service';
import type { Currency } from '../common/currencies';

class NotificationsService {
  private async projectNames(userId: string) {
    const snap = await db.collection(COLLECTIONS.projects).where('userId', '==', userId).get();
    return new Map(snap.docs.map((d) => [d.id, docToEntity<Project>(d).name] as const));
  }

  async getOverdueIncome(userId: string): Promise<{
    entries: OverdueIncomeEntry[];
    totalsByCurrency: { currency: Currency; total: number }[];
  }> {
    const [projectNames, incomeSnap] = await Promise.all([
      this.projectNames(userId),
      db.collection(COLLECTIONS.income).where('userId', '==', userId).get(),
    ]);

    const income = incomeSnap.docs.map((d) => docToEntity<Income>(d));

    const entries = calculateOverdueIncome(income, projectNames);
    return { entries, totalsByCurrency: totalsByCurrency(entries) };
  }

  async getUpcomingRecurringExpenses(
    userId: string,
  ): Promise<{ entries: UpcomingRecurringExpenseEntry[] }> {
    const [projectNames, expenseSnap] = await Promise.all([
      this.projectNames(userId),
      db.collection(COLLECTIONS.expenses).where('userId', '==', userId).get(),
    ]);

    const expenses = expenseSnap.docs.map((d) => docToEntity<Expense>(d));

    return { entries: calculateUpcomingRecurringExpenses(expenses, projectNames) };
  }
}

export const notificationsService = new NotificationsService();
