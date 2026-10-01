import { calculateProfit } from '../common/calculate-profit';
import { monthKey } from '../dashboard/calculate-monthly-trend';
import { Currency } from '../common/currencies';
import type { Client } from '../clients/clients.service';
import type { Project } from '../projects/projects.service';
import type { Income } from '../income/income.service';
import type { Expense } from '../expenses/expenses.service';

/**
 * Every report is a pure fold over the same two collections (plus projects /
 * clients for the joined ones). Keeping the maths here rather than inside
 * ReportsService is what lets `getSummary` answer all of them from a single
 * read — previously each report re-fetched income and expenses for itself,
 * so one Reports page load cost 14 full-collection scans.
 */

export interface MonthlyReportRow {
  month: string;
  currency: Currency;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface ProfitabilityRow {
  projectId: string;
  name: string;
  currency: Currency;
  income: number;
  expenses: number;
  profit: number;
  margin: number;
}

export interface ExpenseBreakdownRow {
  category: string;
  currency: Currency;
  total: number;
}

export interface RevenueBreakdownRow {
  clientId: string | null;
  clientName: string;
  currency: Currency;
  total: number;
}

export function calculateMonthly(
  income: Income[],
  expenses: Expense[],
  month: string,
): MonthlyReportRow[] {
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

export function calculateProfitability(
  projects: Project[],
  income: Income[],
  expenses: Expense[],
): ProfitabilityRow[] {
  return projects
    .flatMap((project) => {
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

export function calculateExpenseBreakdown(expenses: Expense[]): ExpenseBreakdownRow[] {
  const groups = new Map<string, ExpenseBreakdownRow>();
  for (const e of expenses) {
    const currency = e.currency ?? 'USD';
    const key = `${e.category}:${currency}`;
    const entry = groups.get(key) ?? { category: e.category, currency, total: 0 };
    entry.total += Number(e.amount);
    groups.set(key, entry);
  }
  return [...groups.values()].sort((a, b) => b.total - a.total);
}

export function calculateRevenueBreakdown(
  projects: Project[],
  clients: Client[],
  income: Income[],
): RevenueBreakdownRow[] {
  const clientNames = new Map(clients.map((c) => [c.id, c.name] as const));
  const groups = new Map<string, RevenueBreakdownRow>();

  for (const project of projects) {
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
