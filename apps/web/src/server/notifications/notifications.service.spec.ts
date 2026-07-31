let mockDb: ReturnType<typeof createFakeFirestore>['db'];

jest.mock('../firebase', () => ({
  get db() {
    return mockDb;
  },
}));

import { createFakeFirestore } from '../testing/fake-firestore';
import { notificationsService } from './notifications.service';

describe('NotificationsService', () => {
  it('joins project names onto overdue income and excludes other users', async () => {
    mockDb = createFakeFirestore({
      projects: [{ id: 'proj_1', userId: 'user_1', name: 'Website Redesign' }],
      income: [
        {
          id: 'i1',
          userId: 'user_1',
          projectId: 'proj_1',
          amount: 500,
          currency: 'USD',
          status: 'overdue',
          date: '2026-06-01T00:00:00.000Z',
        },
        {
          id: 'i2',
          userId: 'user_2',
          projectId: 'proj_1',
          amount: 999,
          currency: 'USD',
          status: 'overdue',
          date: '2026-06-01T00:00:00.000Z',
        },
      ],
    }).db;

    const result = await notificationsService.getOverdueIncome('user_1');
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].projectName).toBe('Website Redesign');
    expect(result.totalsByCurrency).toEqual([{ currency: 'USD', total: 500 }]);
  });

  it('returns no entries when there is nothing overdue', async () => {
    mockDb = createFakeFirestore({
      projects: [{ id: 'proj_1', userId: 'user_1', name: 'Website Redesign' }],
      income: [
        {
          id: 'i1',
          userId: 'user_1',
          projectId: 'proj_1',
          amount: 500,
          currency: 'USD',
          status: 'paid',
          date: '2026-06-01T00:00:00.000Z',
        },
      ],
    }).db;

    const result = await notificationsService.getOverdueIncome('user_1');
    expect(result.entries).toEqual([]);
    expect(result.totalsByCurrency).toEqual([]);
  });

  it('joins project names onto upcoming recurring expenses and excludes other users', async () => {
    mockDb = createFakeFirestore({
      projects: [{ id: 'proj_1', userId: 'user_1', name: 'Website Redesign' }],
      expenses: [
        {
          id: 'e1',
          userId: 'user_1',
          projectId: 'proj_1',
          amount: 50,
          currency: 'USD',
          category: 'hosting',
          description: 'AWS hosting',
          // Weekly, so the next occurrence is always within 7 days of "now"
          // — deterministic regardless of when this test actually runs.
          date: '2026-01-01T00:00:00.000Z',
          isRecurring: true,
          recurrenceInterval: 'weekly',
        },
        {
          id: 'e2',
          userId: 'user_2',
          projectId: 'proj_1',
          amount: 999,
          currency: 'USD',
          category: 'hosting',
          date: '2026-01-01T00:00:00.000Z',
          isRecurring: true,
          recurrenceInterval: 'weekly',
        },
      ],
    }).db;

    const result = await notificationsService.getUpcomingRecurringExpenses('user_1');
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].projectName).toBe('Website Redesign');
    expect(result.entries[0].description).toBe('AWS hosting');
  });

  it('returns no entries when there are no recurring expenses', async () => {
    mockDb = createFakeFirestore({
      projects: [{ id: 'proj_1', userId: 'user_1', name: 'Website Redesign' }],
      expenses: [
        {
          id: 'e1',
          userId: 'user_1',
          projectId: 'proj_1',
          amount: 50,
          category: 'hosting',
          date: '2026-01-01T00:00:00.000Z',
        },
      ],
    }).db;

    const result = await notificationsService.getUpcomingRecurringExpenses('user_1');
    expect(result.entries).toEqual([]);
  });
});
