import { db } from '../firebase';
import { COLLECTIONS, docToEntity } from '../collections';
import {
  calculateMonthlyTrend,
  type MonthlyTrendEntry,
} from '../dashboard/calculate-monthly-trend';
import {
  calculateMonthly,
  calculateProfitability,
  calculateExpenseBreakdown,
  calculateRevenueBreakdown,
  type MonthlyReportRow,
  type ProfitabilityRow,
  type ExpenseBreakdownRow,
  type RevenueBreakdownRow,
} from './calculate-reports';
import {
  calculatePphUmkmEstimate,
  type PphUmkmEstimate,
} from '../tax/calculate-pph-umkm';
import type { Client } from '../clients/clients.service';
import type { Project } from '../projects/projects.service';
import type { Income } from '../income/income.service';
import type { Expense } from '../expenses/expenses.service';

/** How many years of tax estimates `getSummary` returns, newest first. The
 *  Reports page builds its year dropdown from this rather than deciding for
 *  itself, so the two can't drift apart. */
const TAX_YEARS_RETURNED = 7;

export interface ReportsSummary {
  trend: MonthlyTrendEntry[];
  profitability: ProfitabilityRow[];
  expenseBreakdown: ExpenseBreakdownRow[];
  revenueBreakdown: RevenueBreakdownRow[];
  taxEstimates: PphUmkmEstimate[];
}

class ReportsService {
  private async getAllRecords(userId: string) {
    const [incomeSnap, expenseSnap] = await Promise.all([
      db.collection(COLLECTIONS.income).where('userId', '==', userId).get(),
      db.collection(COLLECTIONS.expenses).where('userId', '==', userId).get(),
    ]);
    return {
      income: incomeSnap.docs.map((d) => docToEntity<Income>(d)),
      expenses: expenseSnap.docs.map((d) => docToEntity<Expense>(d)),
    };
  }

  /**
   * Everything the Reports page renders, from one pass over the data.
   *
   * Deliberately takes no month or year argument: the trend already contains
   * every month, and tax estimates are returned for a span of years, so
   * changing the month picker or the tax-year dropdown is a local filter
   * rather than another round trip. Four collection reads, once.
   */
  async getSummary(userId: string): Promise<ReportsSummary> {
    const [projectSnap, clientSnap, { income, expenses }] = await Promise.all([
      db.collection(COLLECTIONS.projects).where('userId', '==', userId).get(),
      db.collection(COLLECTIONS.clients).where('userId', '==', userId).get(),
      this.getAllRecords(userId),
    ]);

    const projects = projectSnap.docs.map((d) => docToEntity<Project>(d));
    const clients = clientSnap.docs.map((d) => docToEntity<Client>(d));

    const currentYear = new Date().getUTCFullYear();
    const taxEstimates = Array.from({ length: TAX_YEARS_RETURNED }, (_, i) =>
      calculatePphUmkmEstimate(income, currentYear - i),
    );

    return {
      trend: calculateMonthlyTrend(income, expenses),
      profitability: calculateProfitability(projects, income, expenses),
      expenseBreakdown: calculateExpenseBreakdown(expenses),
      revenueBreakdown: calculateRevenueBreakdown(projects, clients, income),
      taxEstimates,
    };
  }

  // The single-report methods below back the PDF routes (and the individual
  // JSON endpoints in 04-API-Specification.md). Each renders one document on
  // demand, so loading records per call is fine there — it's only the Reports
  // *page*, firing all of them at once, that made the repetition expensive.

  async getMonthly(userId: string, month: string): Promise<MonthlyReportRow[]> {
    const { income, expenses } = await this.getAllRecords(userId);
    return calculateMonthly(income, expenses, month);
  }

  async getProfitability(userId: string): Promise<ProfitabilityRow[]> {
    const [projectSnap, { income, expenses }] = await Promise.all([
      db.collection(COLLECTIONS.projects).where('userId', '==', userId).get(),
      this.getAllRecords(userId),
    ]);
    const projects = projectSnap.docs.map((d) => docToEntity<Project>(d));
    return calculateProfitability(projects, income, expenses);
  }

  /** The full multi-month trend — unlike getMonthly, not filtered to one
   *  month. Reuses the same calculateMonthlyTrend the Dashboard summary
   *  already uses, so a Reports export shows exactly what the Dashboard
   *  chart shows. */
  async getMonthlyTrend(userId: string): Promise<MonthlyTrendEntry[]> {
    const { income, expenses } = await this.getAllRecords(userId);
    return calculateMonthlyTrend(income, expenses);
  }

  async getExpenseBreakdown(userId: string): Promise<ExpenseBreakdownRow[]> {
    const { expenses } = await this.getAllRecords(userId);
    return calculateExpenseBreakdown(expenses);
  }

  async getRevenueBreakdown(userId: string): Promise<RevenueBreakdownRow[]> {
    const [projectSnap, clientSnap, { income }] = await Promise.all([
      db.collection(COLLECTIONS.projects).where('userId', '==', userId).get(),
      db.collection(COLLECTIONS.clients).where('userId', '==', userId).get(),
      this.getAllRecords(userId),
    ]);
    const projects = projectSnap.docs.map((d) => docToEntity<Project>(d));
    const clients = clientSnap.docs.map((d) => docToEntity<Client>(d));
    return calculateRevenueBreakdown(projects, clients, income);
  }
}

export const reportsService = new ReportsService();
