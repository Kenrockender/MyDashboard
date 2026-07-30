import { db } from '../firebase';
import { COLLECTIONS, docToEntity } from '../collections';
import {
  calculateOverdueIncome,
  totalsByCurrency,
  type OverdueIncomeEntry,
} from './calculate-overdue-income';
import type { Project } from '../projects/projects.service';
import type { Income } from '../income/income.service';
import type { Currency } from '../common/currencies';

class NotificationsService {
  async getOverdueIncome(userId: string): Promise<{
    entries: OverdueIncomeEntry[];
    totalsByCurrency: { currency: Currency; total: number }[];
  }> {
    const [projectSnap, incomeSnap] = await Promise.all([
      db.collection(COLLECTIONS.projects).where('userId', '==', userId).get(),
      db.collection(COLLECTIONS.income).where('userId', '==', userId).get(),
    ]);

    const projectNames = new Map(
      projectSnap.docs.map((d) => [d.id, docToEntity<Project>(d).name] as const),
    );
    const income = incomeSnap.docs.map((d) => docToEntity<Income>(d));

    const entries = calculateOverdueIncome(income, projectNames);
    return { entries, totalsByCurrency: totalsByCurrency(entries) };
  }
}

export const notificationsService = new NotificationsService();
