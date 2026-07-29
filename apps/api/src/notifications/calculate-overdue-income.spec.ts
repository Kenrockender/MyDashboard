import { calculateOverdueIncome, totalsByCurrency } from './calculate-overdue-income';

describe('calculateOverdueIncome', () => {
  const now = new Date('2026-07-15T00:00:00.000Z');
  const projectNames = new Map([
    ['proj_1', 'Website Redesign'],
    ['proj_2', 'Loyalty App'],
  ]);

  it('includes income explicitly marked overdue', () => {
    const income = [
      {
        id: 'i1',
        projectId: 'proj_1',
        amount: 500,
        status: 'overdue',
        date: '2026-06-01T00:00:00.000Z',
      },
    ];
    expect(calculateOverdueIncome(income, projectNames, now)).toEqual([
      {
        id: 'i1',
        projectId: 'proj_1',
        projectName: 'Website Redesign',
        amount: 500,
        currency: 'USD',
        date: '2026-06-01T00:00:00.000Z',
        kind: 'overdue',
      },
    ]);
  });

  it('includes pending income whose date has already passed, as a softer warning', () => {
    const income = [
      {
        id: 'i1',
        projectId: 'proj_1',
        amount: 300,
        status: 'pending',
        date: '2026-06-01T00:00:00.000Z',
      },
    ];
    expect(calculateOverdueIncome(income, projectNames, now)[0].kind).toBe(
      'pending_past_due',
    );
  });

  it('excludes pending income whose date is still in the future', () => {
    const income = [
      {
        id: 'i1',
        projectId: 'proj_1',
        amount: 300,
        status: 'pending',
        date: '2026-08-01T00:00:00.000Z',
      },
    ];
    expect(calculateOverdueIncome(income, projectNames, now)).toEqual([]);
  });

  it('excludes paid income entirely', () => {
    const income = [
      {
        id: 'i1',
        projectId: 'proj_1',
        amount: 300,
        status: 'paid',
        date: '2026-01-01T00:00:00.000Z',
      },
    ];
    expect(calculateOverdueIncome(income, projectNames, now)).toEqual([]);
  });

  it('sorts oldest first (most urgent)', () => {
    const income = [
      {
        id: 'newer',
        projectId: 'proj_1',
        amount: 100,
        status: 'overdue',
        date: '2026-07-01T00:00:00.000Z',
      },
      {
        id: 'older',
        projectId: 'proj_1',
        amount: 200,
        status: 'overdue',
        date: '2026-05-01T00:00:00.000Z',
      },
    ];
    const result = calculateOverdueIncome(income, projectNames, now);
    expect(result.map((e) => e.id)).toEqual(['older', 'newer']);
  });

  it('falls back to "Unknown project" when the project name is missing', () => {
    const income = [
      {
        id: 'i1',
        projectId: 'proj_missing',
        amount: 100,
        status: 'overdue',
        date: '2026-06-01T00:00:00.000Z',
      },
    ];
    expect(
      calculateOverdueIncome(income, projectNames, now)[0].projectName,
    ).toBe('Unknown project');
  });
});

describe('totalsByCurrency', () => {
  it('groups entries by currency without summing across currencies', () => {
    const entries = [
      {
        id: 'i1',
        projectId: 'p',
        projectName: 'P',
        amount: 100,
        currency: 'USD' as const,
        date: '2026-06-01',
        kind: 'overdue' as const,
      },
      {
        id: 'i2',
        projectId: 'p',
        projectName: 'P',
        amount: 200,
        currency: 'USD' as const,
        date: '2026-06-02',
        kind: 'overdue' as const,
      },
      {
        id: 'i3',
        projectId: 'p',
        projectName: 'P',
        amount: 500000,
        currency: 'IDR' as const,
        date: '2026-06-03',
        kind: 'overdue' as const,
      },
    ];
    expect(totalsByCurrency(entries)).toEqual([
      { currency: 'IDR', total: 500000 },
      { currency: 'USD', total: 300 },
    ]);
  });
});
