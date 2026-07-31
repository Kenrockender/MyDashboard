/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { ProjectTotalsCard } from './project-totals';

const TOTALS = [{ currency: 'USD' as const, income: 5000, expenses: 1200, profit: 3800 }];

describe('ProjectTotalsCard budget meter', () => {
  it('renders no budget meter when no budget is set', () => {
    render(<ProjectTotalsCard totals={TOTALS} />);
    expect(screen.queryByText(/Budget used/)).not.toBeInTheDocument();
  });

  it('shows spend against budget when under budget', () => {
    render(<ProjectTotalsCard totals={TOTALS} budget={2000} budgetCurrency="USD" />);
    expect(screen.getByText('Budget used')).toBeInTheDocument();
    expect(screen.getByText(/\$1,200\.00 of \$2,000\.00/)).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('flags overspend once expenses exceed the budget', () => {
    render(<ProjectTotalsCard totals={TOTALS} budget={1000} budgetCurrency="USD" />);
    expect(screen.getByText(/\$1,200\.00 of \$1,000\.00/)).toBeInTheDocument();
    // MeterRow clamps its own bar/percentage display at 100% — the money
    // figures either side of "of" are what actually show the overage.
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('ignores a budget set in a currency the project has no totals for', () => {
    render(<ProjectTotalsCard totals={TOTALS} budget={5000} budgetCurrency="IDR" />);
    expect(screen.getByText(/of Rp\s?5\.000/)).toBeInTheDocument();
  });
});
