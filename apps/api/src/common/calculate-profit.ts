export interface ProfitTotals {
  income: number;
  expenses: number;
  profit: number;
}

interface Amount {
  amount: number | { toString(): string };
}

export function calculateProfit(income: Amount[], expenses: Amount[]): ProfitTotals {
  const totalIncome = income.reduce((sum, i) => sum + Number(i.amount), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  return { income: totalIncome, expenses: totalExpenses, profit: totalIncome - totalExpenses };
}
