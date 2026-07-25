import { calculateProfit } from './calculate-profit';

describe('calculateProfit', () => {
  it('sums income and expenses and computes profit', () => {
    const result = calculateProfit(
      [{ amount: 2000 }, { amount: 2500 }],
      [{ amount: 320 }],
    );
    expect(result).toEqual([
      { currency: 'USD', income: 4500, expenses: 320, profit: 4180 },
    ]);
  });

  it('handles no records', () => {
    expect(calculateProfit([], [])).toEqual([]);
  });

  it('allows negative profit when expenses exceed income', () => {
    const result = calculateProfit([{ amount: 100 }], [{ amount: 300 }]);
    expect(result).toEqual([
      { currency: 'USD', income: 100, expenses: 300, profit: -200 },
    ]);
  });

  it('groups income and expenses separately per currency', () => {
    const result = calculateProfit(
      [
        { amount: 1000, currency: 'USD' },
        { amount: 5000000, currency: 'IDR' },
      ],
      [{ amount: 200, currency: 'USD' }],
    );
    expect(result).toEqual([
      { currency: 'IDR', income: 5000000, expenses: 0, profit: 5000000 },
      { currency: 'USD', income: 1000, expenses: 200, profit: 800 },
    ]);
  });
});
