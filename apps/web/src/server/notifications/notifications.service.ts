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

export interface NotificationsSummary {
  overdueIncome: {
    entries: OverdueIncomeEntry[];
    totalsByCurrency: { currency: Currency; total: number }[];
  };
  upcomingRecurringExpenses: { entries: UpcomingRecurringExpenseEntry[] };
}

class NotificationsService {
  private async projectNames(userId: string) {
    const snap = await db.collection(COLLECTIONS.projects).where('userId', '==', userId).get();
    return new Map(snap.docs.map((d) => [d.id, docToEntity<Project>(d).name] as const));
  }

  /**
   * Both notification kinds in one pass. The bell polls on an interval, and
   * separately these cost 4 collection reads per tick (each re-reading
   * projects for the name lookup) — this shares that read and halves the
   * round trips.
   */
  async getAll(userId: string): Promise<NotificationsSummary> {
    const [projectNames, incomeSnap, expenseSnap] = await Promise.all([
      this.projectNames(userId),
      db.collection(COLLECTIONS.income).where('userId', '==', userId).get(),
      db.collection(COLLECTIONS.expenses).where('userId', '==', userId).get(),
    ]);

    const income = incomeSnap.docs.map((d) => docToEntity<Income>(d));
    const expenses = expenseSnap.docs.map((d) => docToEntity<Expense>(d));

    const overdueEntries = calculateOverdueIncome(income, projectNames);
    return {
      overdueIncome: {
        entries: overdueEntries,
        totalsByCurrency: totalsByCurrency(overdueEntries),
      },
      upcomingRecurringExpenses: {
        entries: calculateUpcomingRecurringExpenses(expenses, projectNames),
      },
    };
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
