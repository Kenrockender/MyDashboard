import { calculateUpcomingRecurringExpenses } from './calculate-upcoming-recurring-expenses';

describe('calculateUpcomingRecurringExpenses', () => {
  const now = new Date('2026-07-15T00:00:00.000Z');
  const projectNames = new Map([['proj_1', 'Website Redesign']]);

  it('ignores expenses that are not marked recurring', () => {
    const expenses = [
      { id: 'e1', projectId: 'proj_1', amount: 50, category: 'hosting', date: '2026-07-01T00:00:00.000Z' },
    ];
    expect(calculateUpcomingRecurringExpenses(expenses, projectNames, now)).toEqual([]);
  });

  it('computes the next occurrence for a monthly expense', () => {
    const expenses = [
      {
        id: 'e1',
        projectId: 'proj_1',
        amount: 50,
        category: 'hosting',
        description: 'AWS hosting',
        date: '2026-07-01T00:00:00.000Z',
        isRecurring: true,
        recurrenceInterval: 'monthly' as const,
      },
    ];
    // Large lookahead so this test only exercises the date math, not the window filter.
    const result = calculateUpcomingRecurringExpenses(expenses, projectNames, now, 60);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'e1',
      projectName: 'Website Redesign',
      description: 'AWS hosting',
      amount: 50,
      currency: 'USD',
      interval: 'monthly',
    });
    expect(result[0].nextDueDate).toEqual(new Date('2026-08-01T00:00:00.000Z'));
  });

  it('advances past due dates that have already elapsed instead of showing a stale one', () => {
    // Logged 2026-01-01, monthly — by 2026-07-15 the "next" occurrence should
    // be 2026-08-01, not 2026-02-01, which has long since passed.
    const expenses = [
      {
        id: 'e1',
        projectId: 'proj_1',
        amount: 50,
        category: 'hosting',
        date: '2026-01-01T00:00:00.000Z',
        isRecurring: true,
        recurrenceInterval: 'monthly' as const,
      },
    ];
    const result = calculateUpcomingRecurringExpenses(expenses, projectNames, now, 60);
    expect(result[0].nextDueDate).toEqual(new Date('2026-08-01T00:00:00.000Z'));
  });

  it('excludes recurring expenses whose next occurrence is beyond the lookahead window', () => {
    const expenses = [
      {
        id: 'e1',
        projectId: 'proj_1',
        amount: 50,
        category: 'hosting',
        date: '2026-01-01T00:00:00.000Z',
        isRecurring: true,
        recurrenceInterval: 'yearly' as const,
      },
    ];
    // Next occurrence is 2027-01-01 — nowhere near the default 14-day window.
    expect(calculateUpcomingRecurringExpenses(expenses, projectNames, now)).toEqual([]);
  });

  it('respects a custom lookahead window', () => {
    const expenses = [
      {
        id: 'e1',
        projectId: 'proj_1',
        amount: 50,
        category: 'hosting',
        date: '2026-06-20T00:00:00.000Z',
        isRecurring: true,
        recurrenceInterval: 'weekly' as const,
      },
    ];
    // Weekly from 2026-06-20 → 06-27, 07-04, 07-11, 07-18 (first >= 2026-07-15).
    const wideWindow = calculateUpcomingRecurringExpenses(expenses, projectNames, now, 30);
    expect(wideWindow).toHaveLength(1);

    const narrowWindow = calculateUpcomingRecurringExpenses(expenses, projectNames, now, 1);
    expect(narrowWindow).toEqual([]);
  });

  it('sorts multiple entries soonest-first', () => {
    const expenses = [
      {
        id: 'sooner',
        projectId: 'proj_1',
        amount: 100,
        category: 'software_subscription',
        date: '2026-07-10T00:00:00.000Z', // next weekly occurrence: 2026-07-17
        isRecurring: true,
        recurrenceInterval: 'weekly' as const,
      },
      {
        id: 'later',
        projectId: 'proj_1',
        amount: 50,
        category: 'hosting',
        date: '2026-07-14T00:00:00.000Z', // next weekly occurrence: 2026-07-21
        isRecurring: true,
        recurrenceInterval: 'weekly' as const,
      },
    ];
    const result = calculateUpcomingRecurringExpenses(expenses, projectNames, now);
    expect(result.map((e) => e.id)).toEqual(['sooner', 'later']);
  });

  it('falls back to "Unknown project" and "Expense" when name/description are missing', () => {
    const expenses = [
      {
        id: 'e1',
        projectId: 'proj_missing',
        amount: 50,
        category: 'hosting',
        date: '2026-07-01T00:00:00.000Z',
        isRecurring: true,
        recurrenceInterval: 'monthly' as const,
      },
    ];
    const result = calculateUpcomingRecurringExpenses(expenses, projectNames, now, 60);
    expect(result[0].projectName).toBe('Unknown project');
    expect(result[0].description).toBe('Expense');
  });
});
