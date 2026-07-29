/**
 * Demo data seeder.
 *
 * Fills Firestore with a rich, realistic set of clients / projects / income /
 * expenses so every screen (dashboard KPIs + trend chart + recent activity,
 * project list & detail, all four reports) looks fully populated — including
 * a mix of USD and IDR entries, and one one-time-sale project, so the
 * multi-currency and one-time-sale UI can be exercised.
 *
 * Every document it writes carries `_demo: true`, so `npm run unseed` can
 * remove exactly this data and nothing else. Your existing real records are
 * never touched.
 *
 * The data is attached to YOUR user id so you see it after signing in. The id
 * is auto-detected from any existing project/client; if you have none yet,
 * sign in to the app once (which creates data) or pass USER_ID explicitly:
 *   USER_ID=<your-firebase-uid> npm run seed
 *
 * For a larger dataset (e.g. to measure dashboard/reports performance via
 * `npm run measure-perf`), widen the date range and/or multiply the number of
 * clients/projects:
 *   YEARS=3 SCALE=5 USER_ID=<your-firebase-uid> npm run seed
 * YEARS defaults to the original ~9-month window; SCALE defaults to 1 (no
 * duplication). Writes are chunked into batches of 500 (Firestore's per-batch
 * cap), so this scales safely to any volume — a plain single `db.batch()`
 * would throw once total writes crossed that limit.
 *
 * Usage (from apps/api):  npm run seed
 */
import 'dotenv/config';
import {
  getFirestore,
  Timestamp,
  type Firestore,
  type DocumentReference,
} from 'firebase-admin/firestore';
import { getFirebaseApp } from '../src/firebase/firebase-app';
import { COLLECTIONS } from '../src/firebase/collections';

type Currency = 'USD' | 'IDR';

function ts(year: number, month1: number, day: number): Timestamp {
  // month1 is 1-based; build a UTC date so month bucketing matches the app.
  return Timestamp.fromDate(new Date(Date.UTC(year, month1 - 1, day)));
}

async function resolveUserId(db: Firestore): Promise<string> {
  if (process.env.USER_ID) return process.env.USER_ID;
  for (const col of [COLLECTIONS.projects, COLLECTIONS.clients]) {
    const snap = await db.collection(col).limit(1).get();
    const uid: unknown = snap.docs[0]?.data()?.userId;
    if (typeof uid === 'string' && uid.length > 0) return uid;
  }
  throw new Error(
    'Could not auto-detect your user id (no existing data). Sign in to the ' +
      'app once, or run again with USER_ID=<your-firebase-uid> npm run seed',
  );
}

interface PendingWrite {
  ref: DocumentReference;
  data: Record<string, unknown>;
}

async function commitInChunks(
  db: Firestore,
  writes: PendingWrite[],
): Promise<void> {
  for (let i = 0; i < writes.length; i += 500) {
    const batch = db.batch();
    for (const w of writes.slice(i, i + 500)) batch.set(w.ref, w.data);
    await batch.commit();
  }
}

interface ClientDef {
  name: string;
  email: string;
  phone: string;
  company: string;
}

const BASE_CLIENTS: ClientDef[] = [
  {
    name: 'Aurora Coffee Co.',
    email: 'hello@auroracoffee.id',
    phone: '+62 811 2000 100',
    company: 'Aurora Coffee Co.',
  },
  {
    name: 'Nusantara Travel',
    email: 'ops@nusantaratravel.com',
    phone: '+62 812 3400 220',
    company: 'Nusantara Travel',
  },
  {
    name: 'Bright Dental Clinic',
    email: 'admin@brightdental.id',
    phone: '+62 813 5500 330',
    company: 'Bright Dental',
  },
  {
    name: 'Kopi Kita Roastery',
    email: 'orders@kopikita.id',
    phone: '+62 814 7700 440',
    company: 'Kopi Kita',
  },
  {
    name: 'Studio Lumen',
    email: 'studio@lumen.design',
    phone: '+62 815 9900 550',
    company: 'Studio Lumen',
  },
  {
    name: 'GreenLeaf Organics',
    email: 'contact@greenleaf.id',
    phone: '+62 816 1100 660',
    company: 'GreenLeaf Organics',
  },
];

/** Repeats the base client roster `scale` times, batches 1+ getting a
 *  disambiguating suffix so names/emails stay unique. Batch 0 is identical
 *  to the original (unscaled) roster. */
function buildClients(scale: number): ClientDef[] {
  if (scale <= 1) return BASE_CLIENTS;
  const out: ClientDef[] = [];
  for (let batch = 0; batch < scale; batch++) {
    for (const c of BASE_CLIENTS) {
      out.push(
        batch === 0
          ? c
          : {
              ...c,
              name: `${c.name} #${batch + 1}`,
              email: c.email.replace('@', `+${batch + 1}@`),
            },
      );
    }
  }
  return out;
}

// [name, clientIndex, status, startYear, startMonth]
const BASE_PROJECT_DEFS: Array<[string, number, string, number, number]> = [
  ['Aurora Website Redesign', 0, 'completed', 2025, 11],
  ['Aurora Loyalty App', 0, 'active', 2026, 3],
  ['Nusantara Booking Portal', 1, 'active', 2026, 1],
  ['Nusantara Brand Refresh', 1, 'on_hold', 2026, 2],
  ['Bright Dental Booking System', 2, 'completed', 2025, 12],
  ['Bright Dental Marketing Site', 2, 'active', 2026, 4],
  ['Kopi Kita E-commerce', 3, 'active', 2026, 2],
  ['Studio Lumen Portfolio', 4, 'completed', 2026, 1],
  ['GreenLeaf Subscription Box', 5, 'active', 2026, 5],
  ['GreenLeaf Internal Dashboard', 5, 'on_hold', 2026, 6],
];

/** Repeats the base project roster `scale` times, re-pointing each batch's
 *  clientIndex at that batch's slice of the (equally scaled) client list. */
function buildProjectDefs(
  scale: number,
): Array<[string, number, string, number, number]> {
  if (scale <= 1) return BASE_PROJECT_DEFS;
  const out: Array<[string, number, string, number, number]> = [];
  for (let batch = 0; batch < scale; batch++) {
    for (const [name, ci, status, y, m] of BASE_PROJECT_DEFS) {
      out.push([
        batch === 0 ? name : `${name} #${batch + 1}`,
        batch * BASE_CLIENTS.length + ci,
        status,
        y,
        m,
      ]);
    }
  }
  return out;
}

// Nov 2025 -> Jul 2026 — the original, unscaled date range.
const DEFAULT_MONTHS: Array<[number, number]> = [
  [2025, 11],
  [2025, 12],
  [2026, 1],
  [2026, 2],
  [2026, 3],
  [2026, 4],
  [2026, 5],
  [2026, 6],
  [2026, 7],
];

/** Builds a `years`-long run of consecutive months ending at the same
 *  anchor (Jul 2026) the default range ends on, so a YEARS-scaled seed still
 *  covers "now" and reads back into history — not an arbitrary window. */
function buildMonths(years: number): Array<[number, number]> {
  if (years <= 0) return DEFAULT_MONTHS;
  const months: Array<[number, number]> = [];
  let y = 2026;
  let m = 7;
  for (let i = 0; i < years * 12; i++) {
    months.unshift([y, m]);
    m -= 1;
    if (m === 0) {
      m = 12;
      y -= 1;
    }
  }
  return months;
}

async function seed(): Promise<void> {
  const db = getFirestore(
    getFirebaseApp(),
    process.env.FIREBASE_DATABASE_ID ?? '(default)',
  );
  const userId = await resolveUserId(db);
  const scale = Math.max(1, Math.trunc(Number(process.env.SCALE ?? 1)) || 1);
  const years = Math.max(0, Math.trunc(Number(process.env.YEARS ?? 0)) || 0);
  console.log(
    `Seeding demo data for user ${userId} (SCALE=${scale}, YEARS=${years || 'default (~9mo)'})`,
  );

  const writes: PendingWrite[] = [];
  const stage = (ref: DocumentReference, data: Record<string, unknown>) =>
    writes.push({ ref, data });

  // --- Clients -------------------------------------------------------------
  const clients = buildClients(scale);
  const clientIds: string[] = [];
  for (const c of clients) {
    const ref = db.collection(COLLECTIONS.clients).doc();
    clientIds.push(ref.id);
    stage(ref, { _demo: true, userId, createdAt: Timestamp.now(), ...c });
  }

  // --- Projects ------------------------------------------------------------
  // Every other project bills in IDR instead of USD, so the dashboard/reports
  // multi-currency grouping has real data to show.
  const projectDefs = buildProjectDefs(scale);
  const projectIds: string[] = [];
  const projectCurrency: Currency[] = [];
  projectDefs.forEach(([name, ci, status, y, m], pIdx) => {
    const ref = db.collection(COLLECTIONS.projects).doc();
    projectIds.push(ref.id);
    const currency: Currency = pIdx % 2 === 0 ? 'USD' : 'IDR';
    projectCurrency.push(currency);
    stage(ref, {
      _demo: true,
      userId,
      name,
      clientId: clientIds[ci],
      status,
      dealType: 'ongoing',
      startDate: ts(y, m, 5),
      archived: false,
      createdAt: Timestamp.now(),
    });
  });

  // A one-time sale — the lighter flow that skips ongoing income/expense
  // tracking and is auto-marked completed. Always exactly one, regardless of
  // SCALE — it exercises the one-time-sale UI path, not load volume.
  const oneTimeRef = db.collection(COLLECTIONS.projects).doc();
  stage(oneTimeRef, {
    _demo: true,
    userId,
    name: 'Kopi Kita Logo Refresh',
    clientId: clientIds[3],
    status: 'completed',
    dealType: 'one_time',
    startDate: ts(2026, 6, 20),
    archived: false,
    createdAt: Timestamp.now(),
  });
  const oneTimeSaleRef = db.collection(COLLECTIONS.income).doc();
  stage(oneTimeSaleRef, {
    _demo: true,
    userId,
    projectId: oneTimeRef.id,
    amount: 350,
    currency: 'USD' as Currency,
    description: 'Sale',
    status: 'paid',
    date: ts(2026, 6, 20),
    createdAt: Timestamp.now(),
  });
  const oneTimeCostRef = db.collection(COLLECTIONS.expenses).doc();
  stage(oneTimeCostRef, {
    _demo: true,
    userId,
    projectId: oneTimeRef.id,
    amount: 40,
    currency: 'USD' as Currency,
    category: 'miscellaneous',
    description: 'Cost of sale',
    date: ts(2026, 6, 20),
    createdAt: Timestamp.now(),
  });

  // --- Income & Expenses -----------------------------------------------------
  // Spread across the resolved month range so the monthly trend chart shows a
  // curve (and, at YEARS>1, a multi-year one for the perf/load test).
  const months = buildMonths(years);
  const incomeStatuses = ['paid', 'paid', 'paid', 'pending', 'overdue'];
  const expenseCategories = [
    'hosting',
    'software_subscription',
    'freelancer',
    'marketing',
    'domain',
    'api_usage',
    'miscellaneous',
  ];
  // Rough USD->IDR scale so seeded Rupiah amounts read as realistic, not tiny.
  const IDR_SCALE = 15500;

  let incomeCount = 1; // the one-time sale above
  let expenseCount = 1;
  projectIds.forEach((projectId, pIdx) => {
    const currency = projectCurrency[pIdx];
    const scale2 = currency === 'IDR' ? IDR_SCALE : 1;
    // Each project earns across a few months; larger projects earn more.
    const base = (1200 + (pIdx % 4) * 900) * scale2;
    months.forEach(([y, m], mIdx) => {
      // Not every project has activity every month — stagger it.
      if ((pIdx + mIdx) % 3 === 0) return;

      const incRef = db.collection(COLLECTIONS.income).doc();
      const amount = base + ((mIdx * 137 + pIdx * 91) % 2600) * scale2;
      stage(incRef, {
        _demo: true,
        userId,
        projectId,
        amount,
        currency,
        description: 'Milestone payment',
        status: incomeStatuses[(pIdx + mIdx) % incomeStatuses.length],
        date: ts(y, m, 12),
        createdAt: Timestamp.now(),
      });
      incomeCount++;

      const expRef = db.collection(COLLECTIONS.expenses).doc();
      const expAmount = (120 + ((mIdx * 73 + pIdx * 51) % 900)) * scale2;
      stage(expRef, {
        _demo: true,
        userId,
        projectId,
        amount: expAmount,
        currency,
        category: expenseCategories[(pIdx + mIdx) % expenseCategories.length],
        description: 'Recurring project cost',
        date: ts(y, m, 8),
        createdAt: Timestamp.now(),
      });
      expenseCount++;
    });
  });

  await commitInChunks(db, writes);
  console.log(
    `Seeded: ${clients.length} clients, ${projectDefs.length + 1} projects ` +
      `(1 one-time sale), ${incomeCount} income, ${expenseCount} expenses ` +
      `(mixed USD/IDR, all tagged _demo:true). Total writes: ${writes.length}.`,
  );
  console.log('Remove anytime with:  npm run unseed');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
