import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { COLLECTIONS, docToEntity } from '../firebase/collections';
import {
  calculateOverdueIncome,
  totalsByCurrency,
  type OverdueIncomeEntry,
} from './calculate-overdue-income';
import type { Project } from '../projects/projects.service';
import type { Income } from '../income/income.service';
import type { Currency } from '../common/currencies';

@Injectable()
export class NotificationsService {
  constructor(private firebase: FirebaseService) {}

  async getOverdueIncome(userId: string): Promise<{
    entries: OverdueIncomeEntry[];
    totalsByCurrency: { currency: Currency; total: number }[];
  }> {
    const [projectSnap, incomeSnap] = await Promise.all([
      this.firebase.db
        .collection(COLLECTIONS.projects)
        .where('userId', '==', userId)
        .get(),
      this.firebase.db
        .collection(COLLECTIONS.income)
        .where('userId', '==', userId)
        .get(),
    ]);

    const projectNames = new Map(
      projectSnap.docs.map((d) => [d.id, docToEntity<Project>(d).name] as const),
    );
    const income = incomeSnap.docs.map((d) => docToEntity<Income>(d));

    const entries = calculateOverdueIncome(income, projectNames);
    return { entries, totalsByCurrency: totalsByCurrency(entries) };
  }
}
