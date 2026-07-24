import type { ProjectTotals } from '@/hooks/use-projects';

export function ProjectTotalsCard({ totals }: { totals: ProjectTotals }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="border rounded p-4">
        <p className="text-sm text-gray-500">Income</p>
        <p className="text-xl font-semibold">${totals.income.toFixed(2)}</p>
      </div>
      <div className="border rounded p-4">
        <p className="text-sm text-gray-500">Expenses</p>
        <p className="text-xl font-semibold">${totals.expenses.toFixed(2)}</p>
      </div>
      <div className="border rounded p-4">
        <p className="text-sm text-gray-500">Profit</p>
        <p className="text-xl font-semibold">${totals.profit.toFixed(2)}</p>
      </div>
    </div>
  );
}
