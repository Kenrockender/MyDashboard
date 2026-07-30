/**
 * Manual diagnostic tool — NOT wired into CI.
 *
 * Times the exact aggregation logic behind `GET /api/dashboard/summary` and
 * the four `GET /api/reports/*` endpoints against real Firestore reads, so
 * the measured path matches production exactly (this deliberately
 * re-implements each service's query + in-memory aggregation inline rather
 * than going through the Route Handlers, to isolate "Firestore + aggregate"
 * time from HTTP/network overhead).
 *
 * Run this against a realistic dataset (see `seed-demo.ts`'s YEARS/SCALE
 * options) to check the PRD's "<2s dashboard load" NFR:
 *   YEARS=3 SCALE=5 USER_ID=<uid> npm run seed
 *   npx ts-node scripts/measure-perf.ts
 *   npm run unseed
 *
 * Usage (from apps/web):  npx ts-node scripts/measure-perf.ts
 */
// apps/web keeps real local secrets in `.env.local` (Next.js's own convention,
// auto-loaded by `next dev`/`next build` but not by a bare `dotenv/config`
// here), so load it explicitly.
import { config } from 'dotenv';
config({ path: '.env.local' });
import { performance } from 'node:perf_hooks';
import { db } from '../src/server/firebase';
import { COLLECTIONS, docToEntity } from '../src/server/collections';
import { calculateProfit } from '../src/server/common/calculate-profit';
import {
  calculateMonthlyTrend,
  monthKey,
} from '../src/server/dashboard/calculate-monthly-trend';
import { calculateRecentActivity } from '../src/server/dashboard/calculate-recent-activity';
import type { Project } from '../src/server/projects/projects.service';
import type { Client } from '../src/server/clients/clients.service';
import type { Income } from '../src/server/income/income.service';
import type { Expense } from '../src/server/expenses/expenses.service';

const WARMUP_RUNS = 1;
const TIMED_RUNS = 10;

async function resolveUserId(): Promise<string> {
  if (process.env.USER_ID) return process.env.USER_ID;
  for (const col of [COLLECTIONS.projects, COLLECTIONS.clients]) {
    const snap = await db.collection(col).limit(1).get();
    const uid: unknown = snap.docs[0]?.data()?.userId;
    if (typeof uid === 'string' && uid.length > 0) return uid;
  }
  throw new Error(
    'Could not auto-detect a user id. Run with USER_ID=<your-firebase-uid> ' +
      'npx ts-node scripts/measure-perf.ts',
  );
}

// --- The 5 timed paths, each re-implemented to mirror its real service exactly ---

async function getAllRecords(userId: string) {
  const [incomeSnap, expenseSnap] = await Promise.all([
    db.collection(COLLECTIONS.income).where('userId', '==', userId).get(),
    db.collection(COLLECTIONS.expenses).where('userId', '==', userId).get(),
  ]);
  return {
    income: incomeSnap.docs.map((d) => docToEntity<Income>(d)),
    expenses: expenseSnap.docs.map((d) => docToEntity<Expense>(d)),
  };
}

/** Mirrors DashboardService.getSummary. */
async function dashboardSummary(userId: string) {
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

/** Mirrors ReportsService.getMonthly. */
async function reportsMonthly(userId: string, month: string) {
  const { income, expenses } = await getAllRecords(userId);
  const monthIncome = income.filter((i) => monthKey(i.date) === month);
  const monthExpenses = expenses.filter((e) => monthKey(e.date) === month);
  return calculateProfit(monthIncome, monthExpenses);
}

/** Mirrors ReportsService.getProfitability. */
async function reportsProfitability(userId: string) {
  const [projectSnap, { income, expenses }] = await Promise.all([
    db.collection(COLLECTIONS.projects).where('userId', '==', userId).get(),
    getAllRecords(userId),
  ]);
  return projectSnap.docs
    .flatMap((doc) => {
      const project = docToEntity<Project>(doc);
      return calculateProfit(
        income.filter((i) => i.projectId === project.id),
        expenses.filter((e) => e.projectId === project.id),
      );
    })
    .sort((a, b) => b.profit - a.profit);
}

/** Mirrors ReportsService.getExpenseBreakdown. */
async function reportsExpenses(userId: string) {
  const { expenses } = await getAllRecords(userId);
  const groups = new Map<string, number>();
  for (const e of expenses) {
    const key = `${e.category}:${e.currency ?? 'USD'}`;
    groups.set(key, (groups.get(key) ?? 0) + Number(e.amount));
  }
  return groups;
}

/** Mirrors ReportsService.getRevenueBreakdown (the client-name lookup itself
 *  is cheap in-memory work done here too, to match the real query shape —
 *  its result just isn't needed for the timing). */
async function reportsRevenue(userId: string) {
  const [projectSnap, clientSnap, { income }] = await Promise.all([
    db.collection(COLLECTIONS.projects).where('userId', '==', userId).get(),
    db.collection(COLLECTIONS.clients).where('userId', '==', userId).get(),
    getAllRecords(userId),
  ]);
  clientSnap.docs.forEach((d) => docToEntity<Client>(d));
  const groups = new Map<string, number>();
  for (const doc of projectSnap.docs) {
    const project = docToEntity<Project>(doc);
    for (const i of income.filter((i) => i.projectId === project.id)) {
      const key = `${project.clientId ?? 'none'}:${i.currency ?? 'USD'}`;
      groups.set(key, (groups.get(key) ?? 0) + Number(i.amount));
    }
  }
  return groups;
}

// --- Timing harness ---

function percentile(sorted: number[], p: number): number {
  const idx = Math.min(sorted.length - 1, Math.floor(p * sorted.length));
  return sorted[idx];
}

async function measure(label: string, fn: () => Promise<unknown>) {
  for (let i = 0; i < WARMUP_RUNS; i++) await fn();

  const durations: number[] = [];
  for (let i = 0; i < TIMED_RUNS; i++) {
    const start = performance.now();
    await fn();
    durations.push(performance.now() - start);
  }
  durations.sort((a, b) => a - b);

  const fmt = (ms: number) => `${ms.toFixed(0)}ms`;
  console.log(
    `  ${label.padEnd(22)} min=${fmt(durations[0]).padEnd(7)} ` +
      `p50=${fmt(percentile(durations, 0.5)).padEnd(7)} ` +
      `p95=${fmt(percentile(durations, 0.95)).padEnd(7)} ` +
      `max=${fmt(durations[durations.length - 1])}`,
  );
}

async function main(): Promise<void> {
  const userId = await resolveUserId();

  const { income } = await getAllRecords(userId);
  console.log(
    `Measuring performance for user ${userId} ` +
      `(${income.length} income records found)\n`,
  );
  if (income.length === 0) {
    console.warn(
      'No income records found for this user — seed a dataset first, e.g.\n' +
        '  YEARS=3 SCALE=5 USER_ID=' +
        userId +
        ' npm run seed\n',
    );
  }
  const month =
    income.length > 0 ? monthKey(income[0].date) : monthKey(new Date());

  await measure('dashboard.summary', () => dashboardSummary(userId));
  await measure('reports.monthly', () => reportsMonthly(userId, month));
  await measure('reports.profitability', () =>
    reportsProfitability(userId),
  );
  await measure('reports.expenses', () => reportsExpenses(userId));
  await measure('reports.revenue', () => reportsRevenue(userId));

  console.log(
    `\n(${WARMUP_RUNS} warmup + ${TIMED_RUNS} timed runs per endpoint, each doing its own Firestore reads.)`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Measurement failed:', err);
    process.exit(1);
  });
