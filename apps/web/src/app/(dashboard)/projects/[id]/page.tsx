'use client';
import { useParams } from 'next/navigation';
import { useProject } from '@/hooks/use-projects';
import { ProjectTotalsCard } from '@/components/projects/project-totals';
import { IncomeList } from '@/components/projects/income-list';
import { ExpenseList } from '@/components/projects/expense-list';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading } = useProject(id);

  if (isLoading) return <p>Loading...</p>;
  if (!project) return <p>Project not found.</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{project.name}</h1>
      <ProjectTotalsCard totals={project.totals} />
      <IncomeList projectId={id} />
      <ExpenseList projectId={id} />
    </div>
  );
}
