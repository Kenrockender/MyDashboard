import { Timestamp } from 'firebase-admin/firestore';
import { COLLECTIONS } from '../collections';

/**
 * Demo data for LOCAL_MODE. Mirrors the shape `scripts/seed-demo.ts` writes to
 * real Firestore, but runs in-process against the in-memory store so the app
 * has something to show the moment the dev server boots — no Firebase project,
 * emulator, or sign-in required.
 *
 * Dates are anchored to "now" rather than hardcoded, so the dashboard's trend
 * chart and the overdue/upcoming notifications always have relevant data
 * regardless of when this runs.
 */

interface SeedContext {
  addDoc(collection: string, data: Record<string, unknown>): string;
  userId: string;
}

const NOW = new Date();

/** `monthsAgo(0)` is this month; negative values are in the future. */
function monthsAgo(months: number, day = 12): Timestamp {
  return Timestamp.fromDate(
    new Date(Date.UTC(NOW.getUTCFullYear(), NOW.getUTCMonth() - months, day)),
  );
}

function daysFromNow(days: number): Timestamp {
  return Timestamp.fromDate(new Date(NOW.getTime() + days * 24 * 60 * 60 * 1000));
}

const CLIENTS = [
  { name: 'Aurora Coffee Co.', email: 'hello@auroracoffee.id', phone: '+62 811 2000 100', company: 'Aurora Coffee Co.' },
  { name: 'Nusantara Travel', email: 'ops@nusantaratravel.com', phone: '+62 812 3400 220', company: 'Nusantara Travel' },
  { name: 'Bright Dental Clinic', email: 'admin@brightdental.id', phone: '+62 813 5500 330', company: 'Bright Dental' },
  { name: 'Kopi Kita Roastery', email: 'orders@kopikita.id', phone: '+62 814 7700 440', company: 'Kopi Kita' },
  { name: 'Studio Lumen', email: 'studio@lumen.design', phone: '+62 815 9900 550', company: 'Studio Lumen' },
];

// [name, clientIndex, status, currency, budget]
const PROJECTS: Array<[string, number, string, 'USD' | 'IDR', number | null]> = [
  ['Aurora Website Redesign', 0, 'completed', 'USD', 12000],
  ['Aurora Loyalty App', 0, 'active', 'IDR', 250_000_000],
  ['Nusantara Booking Portal', 1, 'active', 'USD', 9000],
  ['Nusantara Brand Refresh', 1, 'on_hold', 'IDR', null],
  ['Bright Dental Booking System', 2, 'completed', 'USD', null],
  ['Kopi Kita E-commerce', 3, 'active', 'IDR', 180_000_000],
  ['Studio Lumen Portfolio', 4, 'active', 'USD', 6500],
];

const EXPENSE_CATEGORIES = [
  'hosting',
  'software_subscription',
  'freelancer',
  'marketing',
  'domain',
  'api_usage',
  'miscellaneous',
];

const INCOME_STATUSES = ['paid', 'paid', 'paid', 'pending', 'overdue'];
const IDR_SCALE = 15_500;
const MONTHS_OF_HISTORY = 14;

export function seedLocalData({ addDoc, userId }: SeedContext) {
  const clientIds = CLIENTS.map((c) =>
    addDoc(COLLECTIONS.clients, { userId, ...c, createdAt: Timestamp.now() }),
  );

  const projectIds: string[] = [];
  const projectCurrencies: Array<'USD' | 'IDR'> = [];

  PROJECTS.forEach(([name, clientIndex, status, currency, budget], index) => {
    const id = addDoc(COLLECTIONS.projects, {
      userId,
      name,
      clientId: clientIds[clientIndex],
      status,
      dealType: 'ongoing',
      startDate: monthsAgo(MONTHS_OF_HISTORY - index, 5),
      archived: false,
      createdAt: monthsAgo(MONTHS_OF_HISTORY - index, 5),
      budget,
      budgetCurrency: budget === null ? null : currency,
    });
    projectIds.push(id);
    projectCurrencies.push(currency);
  });

  // A one-time sale — exercises the lighter flow that skips ongoing tracking.
  const oneTimeId = addDoc(COLLECTIONS.projects, {
    userId,
    name: 'Kopi Kita Logo Refresh',
    clientId: clientIds[3],
    status: 'completed',
    dealType: 'one_time',
    startDate: monthsAgo(1, 20),
    archived: false,
    createdAt: monthsAgo(1, 20),
    budget: null,
    budgetCurrency: null,
  });
  addDoc(COLLECTIONS.income, {
    userId,
    projectId: oneTimeId,
    amount: 350,
    currency: 'USD',
    description: 'Sale',
    status: 'paid',
    date: monthsAgo(1, 20),
    createdAt: monthsAgo(1, 20),
  });
  addDoc(COLLECTIONS.expenses, {
    userId,
    projectId: oneTimeId,
    amount: 40,
    currency: 'USD',
    category: 'miscellaneous',
    description: 'Cost of sale',
    date: monthsAgo(1, 20),
    createdAt: monthsAgo(1, 20),
    isRecurring: false,
    recurrenceInterval: null,
  });

  // Income + expenses spread across the last ~14 months so the trend chart
  // draws a real curve and the reports have something to break down.
  projectIds.forEach((projectId, pIdx) => {
    const currency = projectCurrencies[pIdx];
    const scale = currency === 'IDR' ? IDR_SCALE : 1;
    const base = (1200 + (pIdx % 4) * 900) * scale;

    for (let mIdx = 0; mIdx < MONTHS_OF_HISTORY; mIdx++) {
      if ((pIdx + mIdx) % 3 === 0) continue; // stagger activity
      const monthsBack = MONTHS_OF_HISTORY - 1 - mIdx;

      addDoc(COLLECTIONS.income, {
        userId,
        projectId,
        amount: base + ((mIdx * 137 + pIdx * 91) % 2600) * scale,
        currency,
        description: 'Milestone payment',
        status: INCOME_STATUSES[(pIdx + mIdx) % INCOME_STATUSES.length],
        date: monthsAgo(monthsBack, 12),
        createdAt: monthsAgo(monthsBack, 12),
      });

      addDoc(COLLECTIONS.expenses, {
        userId,
        projectId,
        amount: (120 + ((mIdx * 73 + pIdx * 51) % 900)) * scale,
        currency,
        category: EXPENSE_CATEGORIES[(pIdx + mIdx) % EXPENSE_CATEGORIES.length],
        description: 'Project cost',
        date: monthsAgo(monthsBack, 8),
        createdAt: monthsAgo(monthsBack, 8),
        isRecurring: false,
        recurrenceInterval: null,
      });
    }
  });

  // Two recurring expenses due within the notification window, so the bell
  // has upcoming reminders to show.
  addDoc(COLLECTIONS.expenses, {
    userId,
    projectId: projectIds[1],
    amount: 450_000,
    currency: 'IDR',
    category: 'hosting',
    description: 'Server hosting',
    date: daysFromNow(-25),
    createdAt: daysFromNow(-25),
    isRecurring: true,
    recurrenceInterval: 'monthly',
  });
  addDoc(COLLECTIONS.expenses, {
    userId,
    projectId: projectIds[2],
    amount: 29,
    currency: 'USD',
    category: 'software_subscription',
    description: 'Design tool subscription',
    date: daysFromNow(-3),
    createdAt: daysFromNow(-3),
    isRecurring: true,
    recurrenceInterval: 'weekly',
  });

  // A couple of invoices so the Invoices page isn't empty.
  const invoiceIncomeId = addDoc(COLLECTIONS.income, {
    userId,
    projectId: projectIds[0],
    amount: 4500,
    currency: 'USD',
    description: 'Phase 1 delivery',
    status: 'paid',
    date: monthsAgo(2, 15),
    createdAt: monthsAgo(2, 15),
  });
  addDoc(COLLECTIONS.invoices, {
    userId,
    projectId: projectIds[0],
    clientId: clientIds[0],
    invoiceNumber: `INV-${NOW.getUTCFullYear()}-0001`,
    incomeIds: [invoiceIncomeId],
    currency: 'USD',
    subtotal: 4500,
    status: 'paid',
    issueDate: monthsAgo(2, 15),
    dueDate: monthsAgo(1, 15),
    notes: null,
    sentAt: monthsAgo(2, 16),
    paidAt: monthsAgo(1, 10),
    createdAt: monthsAgo(2, 15),
  });

  const secondInvoiceIncomeId = addDoc(COLLECTIONS.income, {
    userId,
    projectId: projectIds[2],
    amount: 3200,
    currency: 'USD',
    description: 'Booking portal milestone',
    status: 'pending',
    date: monthsAgo(0, 5),
    createdAt: monthsAgo(0, 5),
  });
  addDoc(COLLECTIONS.invoices, {
    userId,
    projectId: projectIds[2],
    clientId: clientIds[1],
    invoiceNumber: `INV-${NOW.getUTCFullYear()}-0002`,
    incomeIds: [secondInvoiceIncomeId],
    currency: 'USD',
    subtotal: 3200,
    status: 'sent',
    issueDate: monthsAgo(0, 5),
    dueDate: daysFromNow(10),
    notes: 'Net 14',
    sentAt: monthsAgo(0, 6),
    paidAt: null,
    createdAt: monthsAgo(0, 5),
  });

  // Time entries on an active project.
  for (const [hours, description, daysBack] of [
    [6.5, 'Booking flow implementation', 2],
    [3, 'Client revisions', 5],
    [8, 'API integration', 9],
  ] as const) {
    addDoc(COLLECTIONS.timeEntries, {
      userId,
      projectId: projectIds[2],
      description,
      hours,
      date: daysFromNow(-daysBack),
      hourlyRate: 75,
      currency: 'USD',
      status: 'unlogged',
      incomeId: null,
      createdAt: daysFromNow(-daysBack),
    });
  }
}
