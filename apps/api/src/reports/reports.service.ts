import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { COLLECTIONS, docToEntity } from '../firebase/collections';
import { calculateProfit } from '../common/calculate-profit';
import { monthKey } from '../dashboard/calculate-monthly-trend';
import type { Client } from '../clients/clients.service';
import type { Project } from '../projects/projects.service';
import type { Income } from '../income/income.service';
import type { Expense } from '../expenses/expenses.service';

@Injectable()
export class ReportsService {
  constructor(private firebase: FirebaseService) {}

  private async getAllRecords(userId: string) {
    const [incomeSnap, expenseSnap] = await Promise.all([
      this.firebase.db
        .collection(COLLECTIONS.income)
        .where('userId', '==', userId)
        .get(),
      this.firebase.db
        .collection(COLLECTIONS.expenses)
        .where('userId', '==', userId)
        .get(),
    ]);
    return {
      income: incomeSnap.docs.map((d) => docToEntity<Income>(d)),
      expenses: expenseSnap.docs.map((d) => docToEntity<Expense>(d)),
    };
  }

  async getMonthly(userId: string, month: string) {
    const { income, expenses } = await this.getAllRecords(userId);
    const monthIncome = income.filter((i) => monthKey(i.date) === month);
    const monthExpenses = expenses.filter((e) => monthKey(e.date) === month);
    const totals = calculateProfit(monthIncome, monthExpenses);
    return {
      month,
      revenue: totals.income,
      expenses: totals.expenses,
      profit: totals.profit,
    };
  }

  async getProfitability(userId: string) {
    const [projectSnap, { income, expenses }] = await Promise.all([
      this.firebase.db
        .collection(COLLECTIONS.projects)
        .where('userId', '==', userId)
        .get(),
      this.getAllRecords(userId),
    ]);

    return projectSnap.docs
      .map((doc) => {
        const project = docToEntity<Project>(doc);
        const totals = calculateProfit(
          income.filter((i) => i.projectId === project.id),
          expenses.filter((e) => e.projectId === project.id),
        );
        return {
          projectId: project.id,
          name: project.name,
          income: totals.income,
          expenses: totals.expenses,
          profit: totals.profit,
          margin: totals.income > 0 ? totals.profit / totals.income : 0,
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
    const [projectSnap, clientSnap, { income }] = await Promise.all([
      this.firebase.db
        .collection(COLLECTIONS.projects)
        .where('userId', '==', userId)
        .get(),
      this.firebase.db
        .collection(COLLECTIONS.clients)
        .where('userId', '==', userId)
        .get(),
      this.getAllRecords(userId),
    ]);

    const clientNames = new Map(
      clientSnap.docs.map((d) => [d.id, docToEntity<Client>(d).name] as const),
    );

    const groups = new Map<
      string,
      { clientId: string | null; clientName: string; total: number }
    >();
    for (const doc of projectSnap.docs) {
      const project = docToEntity<Project>(doc);
      const key = project.clientId ?? 'none';
      const projectTotal = income
        .filter((i) => i.projectId === project.id)
        .reduce((sum, i) => sum + Number(i.amount), 0);

      const entry = groups.get(key) ?? {
        clientId: project.clientId ?? null,
        clientName: project.clientId
          ? (clientNames.get(project.clientId) ?? 'No client')
          : 'No client',
        total: 0,
      };
      entry.total += projectTotal;
      groups.set(key, entry);
    }

    return [...groups.values()].sort((a, b) => b.total - a.total);
  }
}
