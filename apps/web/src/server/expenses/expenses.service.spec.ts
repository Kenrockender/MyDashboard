// `expensesService` imports `db` as a module-level singleton (no DI to swap
// in a fake), so the fake Firestore is substituted by mocking the `../firebase`
// module itself. The mock returns a getter so each test's `beforeEach` can
// swap in a fresh fake store before the service reads `db` at call time.
let mockDb: ReturnType<typeof createFakeFirestore>['db'];

jest.mock('../firebase', () => ({
  get db() {
    return mockDb;
  },
}));

import { createFakeFirestore } from '../testing/fake-firestore';
import { expensesService } from './expenses.service';

describe('ExpensesService recurring fields', () => {
  beforeEach(() => {
    mockDb = createFakeFirestore({
      projects: [{ id: 'proj_1', userId: 'user_1' }],
    }).db;
  });

  it('defaults to non-recurring when not specified', async () => {
    const expense = await expensesService.create('user_1', 'proj_1', {
      amount: 50,
      category: 'hosting',
      date: '2026-07-01',
    });
    expect(expense.isRecurring).toBe(false);
    expect(expense.recurrenceInterval).toBeNull();
  });

  it('stores the recurrence interval when marked recurring', async () => {
    const expense = await expensesService.create('user_1', 'proj_1', {
      amount: 50,
      category: 'hosting',
      date: '2026-07-01',
      isRecurring: true,
      recurrenceInterval: 'monthly',
    });
    expect(expense.isRecurring).toBe(true);
    expect(expense.recurrenceInterval).toBe('monthly');
  });

  it('ignores a recurrence interval when isRecurring is not set', async () => {
    const expense = await expensesService.create('user_1', 'proj_1', {
      amount: 50,
      category: 'hosting',
      date: '2026-07-01',
      recurrenceInterval: 'monthly',
    });
    expect(expense.isRecurring).toBe(false);
    expect(expense.recurrenceInterval).toBeNull();
  });

  it('clears the interval when recurrence is turned off via update', async () => {
    const expense = await expensesService.create('user_1', 'proj_1', {
      amount: 50,
      category: 'hosting',
      date: '2026-07-01',
      isRecurring: true,
      recurrenceInterval: 'weekly',
    });

    const updated = await expensesService.update('user_1', expense.id, { isRecurring: false });
    expect(updated.isRecurring).toBe(false);
    expect(updated.recurrenceInterval).toBeNull();
  });

  it('updates the interval while recurrence stays on', async () => {
    const expense = await expensesService.create('user_1', 'proj_1', {
      amount: 50,
      category: 'hosting',
      date: '2026-07-01',
      isRecurring: true,
      recurrenceInterval: 'weekly',
    });

    const updated = await expensesService.update('user_1', expense.id, {
      recurrenceInterval: 'yearly',
    });
    expect(updated.isRecurring).toBe(true);
    expect(updated.recurrenceInterval).toBe('yearly');
  });
});
