import { calculateMonthlyTrend } from './calculate-monthly-trend';

describe('calculateMonthlyTrend', () => {
  it('buckets income and expenses into separate months across a month boundary', () => {
    const income = [
      { amount: 1000, date: '2026-05-31T00:00:00.000Z' },
      { amount: 2000, date: '2026-06-01T00:00:00.000Z' },
      { amount: 500, date: '2026-06-15T00:00:00.000Z' },
    ];
    const expenses = [
      { amount: 100, date: '2026-05-31T00:00:00.000Z' },
      { amount: 300, date: '2026-06-02T00:00:00.000Z' },
    ];

    const result = calculateMonthlyTrend(income, expenses);

    expect(result).toEqual([
      {
        month: '2026-05',
        currency: 'USD',
        revenue: 1000,
        expenses: 100,
        profit: 900,
      },
      {
        month: '2026-06',
        currency: 'USD',
        revenue: 2500,
        expenses: 300,
        profit: 2200,
      },
    ]);
  });

  it('returns an empty array when there is no data', () => {
    expect(calculateMonthlyTrend([], [])).toEqual([]);
  });

  it('handles a month with expenses but no income', () => {
    const result = calculateMonthlyTrend(
      [],
      [{ amount: 50, date: '2026-07-01T00:00:00.000Z' }],
    );
    expect(result).toEqual([
      {
        month: '2026-07',
        currency: 'USD',
        revenue: 0,
        expenses: 50,
        profit: -50,
      },
    ]);
  });

  it('keeps different currencies in the same month as separate entries', () => {
    const income: { amount: number; currency: 'USD' | 'IDR'; date: string }[] =
      [
        { amount: 1000, currency: 'USD', date: '2026-06-01T00:00:00.000Z' },
        { amount: 5000000, currency: 'IDR', date: '2026-06-02T00:00:00.000Z' },
      ];

    const result = calculateMonthlyTrend(income, []);

    expect(result).toEqual([
      {
        month: '2026-06',
        currency: 'IDR',
        revenue: 5000000,
        expenses: 0,
        profit: 5000000,
      },
      {
        month: '2026-06',
        currency: 'USD',
        revenue: 1000,
        expenses: 0,
        profit: 1000,
      },
    ]);
  });
});
