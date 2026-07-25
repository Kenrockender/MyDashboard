import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { COLLECTIONS, docToEntity } from '../firebase/collections';
import { calculateProfit } from '../common/calculate-profit';
import { monthKey } from '../dashboard/calculate-monthly-trend';
import { Currency } from '../common/currencies';
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
    return calculateProfit(monthIncome, monthExpenses).map((totals) => ({
      month,
      currency: totals.currency,
      revenue: totals.income,
      expenses: totals.expenses,
      profit: totals.profit,
    }));
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
      .flatMap((doc) => {
        const project = docToEntity<Project>(doc);
        const rawTotals = calculateProfit(
          income.filter((i) => i.projectId === project.id),
          expenses.filter((e) => e.projectId === project.id),
        );
        // A project with no income/expenses at all still gets one $0 row so it
        // stays visible in the report, instead of disappearing entirely.
        const totals =
          rawTotals.length > 0
            ? rawTotals
            : [{ currency: 'USD' as const, income: 0, expenses: 0, profit: 0 }];
        return totals.map((t) => ({
          projectId: project.id,
          name: project.name,
          currency: t.currency,
          income: t.income,
          expenses: t.expenses,
          profit: t.profit,
          margin: t.income > 0 ? t.profit / t.income : 0,
        }));
      })
      .sort((a, b) => b.profit - a.profit);
  }

  async getExpenseBreakdown(userId: string) {
    const { expenses } = await this.getAllRecords(userId);
    const groups = new Map<
      string,
      { category: string; currency: Currency; total: number }
    >();
    for (const e of expenses) {
      const currency = e.currency ?? 'USD';
      const key = `${e.category}:${currency}`;
      const entry = groups.get(key) ?? {
        category: e.category,
        currency,
        total: 0,
      };
      entry.total += Number(e.amount);
      groups.set(key, entry);
    }
    return [...groups.values()].sort((a, b) => b.total - a.total);
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
      {
        clientId: string | null;
        clientName: string;
        currency: Currency;
        total: number;
      }
    >();
    for (const doc of projectSnap.docs) {
      const project = docToEntity<Project>(doc);
      const clientKey = project.clientId ?? 'none';
      const clientName = project.clientId
        ? (clientNames.get(project.clientId) ?? 'No client')
        : 'No client';

      for (const i of income.filter((i) => i.projectId === project.id)) {
        const currency = i.currency ?? 'USD';
        const key = `${clientKey}:${currency}`;
        const entry = groups.get(key) ?? {
          clientId: project.clientId ?? null,
          clientName,
          currency,
          total: 0,
        };
        entry.total += Number(i.amount);
        groups.set(key, entry);
      }
    }

    return [...groups.values()].sort((a, b) => b.total - a.total);
  }
}
