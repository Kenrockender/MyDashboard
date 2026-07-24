import { calculateProfit } from './calculate-profit';

describe('calculateProfit', () => {
  it('sums income and expenses and computes profit', () => {
    const result = calculateProfit(
      [{ amount: 2000 }, { amount: 2500 }],
      [{ amount: 320 }],
    );
    expect(result).toEqual({ income: 4500, expenses: 320, profit: 4180 });
  });

  it('handles no records', () => {
    expect(calculateProfit([], [])).toEqual({
      income: 0,
      expenses: 0,
      profit: 0,
    });
  });

  it('allows negative profit when expenses exceed income', () => {
    const result = calculateProfit([{ amount: 100 }], [{ amount: 300 }]);
    expect(result).toEqual({ income: 100, expenses: 300, profit: -200 });
  });
});
