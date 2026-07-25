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
 * Usage (from apps/api):  npm run seed
 */
import 'dotenv/config';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getFirebaseApp } from '../src/firebase/firebase-app';
import { COLLECTIONS } from '../src/firebase/collections';

type Currency = 'USD' | 'IDR';

function ts(year: number, month1: number, day: number): Timestamp {
  // month1 is 1-based; build a UTC date so month bucketing matches the app.
  return Timestamp.fromDate(new Date(Date.UTC(year, month1 - 1, day)));
}

async function resolveUserId(db: FirebaseFirestore.Firestore): Promise<string> {
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

async function seed(): Promise<void> {
  const db = getFirestore(
    getFirebaseApp(),
    process.env.FIREBASE_DATABASE_ID ?? '(default)',
  );
  const userId = await resolveUserId(db);
  console.log(`Seeding demo data for user ${userId}`);

  const batch = db.batch();
  const demo = { _demo: true, userId, createdAt: Timestamp.now() };

  // --- Clients -------------------------------------------------------------
  const clients = [
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
  const clientIds: string[] = [];
  for (const c of clients) {
    const ref = db.collection(COLLECTIONS.clients).doc();
    clientIds.push(ref.id);
    batch.set(ref, { ...demo, ...c });
  }

  // --- Projects ------------------------------------------------------------
  // [name, clientIndex, status, startYear, startMonth]
  // Every other project bills in IDR instead of USD, so the dashboard/reports
  // multi-currency grouping has real data to show.
  const projectDefs: Array<[string, number, string, number, number]> = [
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
  const projectIds: string[] = [];
  const projectCurrency: Currency[] = [];
  projectDefs.forEach(([name, ci, status, y, m], pIdx) => {
    const ref = db.collection(COLLECTIONS.projects).doc();
    projectIds.push(ref.id);
    const currency: Currency = pIdx % 2 === 0 ? 'USD' : 'IDR';
    projectCurrency.push(currency);
    batch.set(ref, {
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
  // tracking and is auto-marked completed.
  const oneTimeRef = db.collection(COLLECTIONS.projects).doc();
  batch.set(oneTimeRef, {
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
  batch.set(oneTimeSaleRef, {
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
  batch.set(oneTimeCostRef, {
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

  // --- Income & Expenses ---------------------------------------------------
  // Spread across Nov 2025 -> Jul 2026 so the monthly trend chart shows a curve.
  const months: Array<[number, number]> = [
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
    const scale = currency === 'IDR' ? IDR_SCALE : 1;
    // Each project earns across a few months; larger projects earn more.
    const base = (1200 + (pIdx % 4) * 900) * scale;
    months.forEach(([y, m], mIdx) => {
      // Not every project has activity every month — stagger it.
      if ((pIdx + mIdx) % 3 === 0) return;

      const incRef = db.collection(COLLECTIONS.income).doc();
      const amount = base + ((mIdx * 137 + pIdx * 91) % 2600) * scale;
      batch.set(incRef, {
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
      const expAmount = (120 + ((mIdx * 73 + pIdx * 51) % 900)) * scale;
      batch.set(expRef, {
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

  await batch.commit();
  console.log(
    `Seeded: ${clients.length} clients, ${projectDefs.length + 1} projects ` +
      `(1 one-time sale), ${incomeCount} income, ${expenseCount} expenses ` +
      `(mixed USD/IDR, all tagged _demo:true).`,
  );
  console.log('Remove anytime with:  npm run unseed');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
