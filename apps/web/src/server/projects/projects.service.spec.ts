// `projectsService` imports `db` as a module-level singleton (no DI to swap
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
import { projectsService } from './projects.service';

describe('ProjectsService.findOne totals', () => {
  beforeEach(() => {
    mockDb = createFakeFirestore({
      projects: [
        {
          id: 'proj_1',
          userId: 'user_1',
          name: 'Website redesign',
          clientId: null,
          archived: false,
          createdAt: '2026-07-01T00:00:00.000Z',
        },
        {
          id: 'proj_2',
          userId: 'user_1',
          name: 'Mobile app',
          clientId: 'client_1',
          archived: false,
          createdAt: '2026-07-02T00:00:00.000Z',
        },
      ],
      income: [
        { id: 'inc_1', projectId: 'proj_1', amount: 2000 },
        { id: 'inc_2', projectId: 'proj_1', amount: 2500 },
      ],
      expenses: [{ id: 'exp_1', projectId: 'proj_1', amount: 320 }],
    }).db;
  });

  it('computes income, expenses, and profit', async () => {
    const result = await projectsService.findOne('user_1', 'proj_1');
    expect(result!.totals).toEqual([
      { currency: 'USD', income: 4500, expenses: 320, profit: 4180 },
    ]);
  });

  it('returns null for a project owned by someone else', async () => {
    expect(await projectsService.findOne('user_2', 'proj_1')).toBeNull();
  });

  it('searches project names within the authenticated user projects', async () => {
    const result = await projectsService.findAll('user_1', { search: 'WEB' });

    expect(result.items.map((project) => project.id)).toEqual(['proj_1']);
  });

  it('paginates results, keyed off the createdAt cursor', async () => {
    const first = await projectsService.findAll('user_1', {}, { limit: 1 });
    expect(first.items.map((p) => p.id)).toEqual(['proj_2']);
    expect(first.nextCursor).toBeTruthy();

    const second = await projectsService.findAll('user_1', {}, { limit: 1, cursor: first.nextCursor! });
    expect(second.items.map((p) => p.id)).toEqual(['proj_1']);
    expect(second.nextCursor).toBeNull();
  });
});

describe('ProjectsService one-time sale', () => {
  beforeEach(() => {
    mockDb = createFakeFirestore().db;
  });

  it('creates a completed project with a single income and expense record', async () => {
    const project = await projectsService.create('user_1', {
      name: 'Logo for Kopi Kita',
      dealType: 'one_time',
      saleAmount: 1500,
      saleCurrency: 'USD',
      cost: 200,
    });

    expect(project.dealType).toBe('one_time');
    expect(project.status).toBe('completed');

    const detail = await projectsService.findOne('user_1', project.id);
    expect(detail!.totals).toEqual([
      { currency: 'USD', income: 1500, expenses: 200, profit: 1300 },
    ]);
  });

  it('skips the expense record when no cost is given', async () => {
    const project = await projectsService.create('user_1', {
      name: 'Quick sale',
      dealType: 'one_time',
      saleAmount: 500,
    });

    const detail = await projectsService.findOne('user_1', project.id);
    expect(detail!.totals).toEqual([
      { currency: 'USD', income: 500, expenses: 0, profit: 500 },
    ]);
  });

  it('defaults ongoing projects to active status as before', async () => {
    const project = await projectsService.create('user_1', { name: 'Ongoing work' });
    expect(project.dealType).toBe('ongoing');
    expect(project.status).toBe('active');
  });

  it('ignores a budget passed on a one-time sale — budget only applies to ongoing projects', async () => {
    const project = await projectsService.create('user_1', {
      name: 'Logo for Kopi Kita',
      dealType: 'one_time',
      saleAmount: 1500,
      budget: 999,
      budgetCurrency: 'USD',
    });
    expect(project.budget).toBeNull();
    expect(project.budgetCurrency).toBeNull();
  });
});

describe('ProjectsService budget', () => {
  beforeEach(() => {
    mockDb = createFakeFirestore().db;
  });

  it('stores a budget set at creation', async () => {
    const project = await projectsService.create('user_1', {
      name: 'Ongoing work',
      budget: 5000,
      budgetCurrency: 'USD',
    });
    expect(project.budget).toBe(5000);
    expect(project.budgetCurrency).toBe('USD');
  });

  it('defaults to no budget when none is given', async () => {
    const project = await projectsService.create('user_1', { name: 'Ongoing work' });
    expect(project.budget).toBeNull();
    expect(project.budgetCurrency).toBeNull();
  });

  it('sets a budget via update', async () => {
    const project = await projectsService.create('user_1', { name: 'Ongoing work' });
    const updated = await projectsService.update('user_1', project.id, {
      budget: 3000,
      budgetCurrency: 'IDR',
    });
    expect(updated!.budget).toBe(3000);
    expect(updated!.budgetCurrency).toBe('IDR');
  });

  it('clears a budget via update by passing null', async () => {
    const project = await projectsService.create('user_1', {
      name: 'Ongoing work',
      budget: 5000,
      budgetCurrency: 'USD',
    });
    const updated = await projectsService.update('user_1', project.id, {
      budget: null,
      budgetCurrency: null,
    });
    expect(updated!.budget).toBeNull();
    expect(updated!.budgetCurrency).toBeNull();
  });
});
