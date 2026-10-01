let mockDb: ReturnType<typeof createFakeFirestore>['db'];
let collectionReads: string[];

jest.mock('../firebase', () => ({
  get db() {
    // Counts every `.collection(name)` opened — that's what the Firestore
    // read quota is actually spent on, and this endpoint polls.
    return {
      ...mockDb,
      collection(name: string) {
        collectionReads.push(name);
        return mockDb.collection(name);
      },
    };
  },
}));

import { createFakeFirestore } from '../testing/fake-firestore';
import { notificationsService } from './notifications.service';

const DAY_MS = 24 * 60 * 60 * 1000;
const iso = (offsetDays: number) => new Date(Date.now() + offsetDays * DAY_MS).toISOString();

describe('NotificationsService.getAll', () => {
  beforeEach(() => {
    collectionReads = [];
    mockDb = createFakeFirestore({
      projects: [{ id: 'proj_1', userId: 'user_1', name: 'Website Redesign' }],
      income: [
        {
          id: 'inc_1',
          userId: 'user_1',
          projectId: 'proj_1',
          amount: 500,
          currency: 'USD',
          status: 'overdue',
          date: iso(-30),
        },
      ],
      expenses: [
        {
          id: 'exp_1',
          userId: 'user_1',
          projectId: 'proj_1',
          amount: 50,
          currency: 'USD',
          category: 'hosting',
          description: 'Server hosting',
          // Weekly, so the next occurrence always lands inside the lookahead
          // window regardless of when this test runs.
          date: iso(-30),
          isRecurring: true,
          recurrenceInterval: 'weekly',
        },
      ],
    }).db;
  });

  it('reads each collection once, sharing the projects lookup', async () => {
    await notificationsService.getAll('user_1');

    // Previously the bell called two endpoints that each re-read projects,
    // costing 4 collection reads per poll.
    expect(collectionReads.sort()).toEqual(['expenses', 'income', 'projects']);
  });

  it('returns both notification kinds with project names joined in', async () => {
    const result = await notificationsService.getAll('user_1');

    expect(result.overdueIncome.entries).toHaveLength(1);
    expect(result.overdueIncome.entries[0].projectName).toBe('Website Redesign');
    expect(result.overdueIncome.totalsByCurrency).toEqual([{ currency: 'USD', total: 500 }]);

    expect(result.upcomingRecurringExpenses.entries).toHaveLength(1);
    expect(result.upcomingRecurringExpenses.entries[0].projectName).toBe('Website Redesign');
    expect(result.upcomingRecurringExpenses.entries[0].description).toBe('Server hosting');
  });

  it('matches what the individual methods return', async () => {
    const [combined, overdue, upcoming] = await Promise.all([
      notificationsService.getAll('user_1'),
      notificationsService.getOverdueIncome('user_1'),
      notificationsService.getUpcomingRecurringExpenses('user_1'),
    ]);

    expect(combined.overdueIncome).toEqual(overdue);
    expect(combined.upcomingRecurringExpenses.entries.map((e) => e.id)).toEqual(
      upcoming.entries.map((e) => e.id),
    );
  });

  it('excludes another user entirely', async () => {
    const result = await notificationsService.getAll('user_2');
    expect(result.overdueIncome.entries).toEqual([]);
    expect(result.upcomingRecurringExpenses.entries).toEqual([]);
  });
});
