'use client';
import { useParams, useRouter } from 'next/navigation';
import { useProject, useUpdateProject, useArchiveProject } from '@/hooks/use-projects';
import { ProjectTotalsCard } from '@/components/projects/project-totals';
import { IncomeList } from '@/components/projects/income-list';
import { ExpenseList } from '@/components/projects/expense-list';
import { CardSkeleton, Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { useToast } from '@/lib/toast-context';

const STATUSES = ['active', 'on_hold', 'completed'];

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading, isError, refetch } = useProject(id);
  const updateProject = useUpdateProject(id);
  const archiveProject = useArchiveProject(id);
  const { showToast } = useToast();
  const router = useRouter();

  if (isError) return <ErrorState message="Couldn't load this project." onRetry={refetch} />;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (!project) return <p className="text-sm text-ink-muted">Project not found.</p>;

  function handleStatusChange(status: string) {
    updateProject.mutate(
      { status },
      {
        onSuccess: () => showToast('Project status updated.'),
        onError: () => showToast("Couldn't update status — try again.", 'error'),
      },
    );
  }

  function handleArchive() {
    if (!window.confirm(`Archive "${project?.name}"? It will be hidden from your projects list.`)) return;
    archiveProject.mutate(undefined, {
      onSuccess: () => {
        showToast('Project archived.');
        router.push('/projects');
      },
      onError: () => showToast("Couldn't archive project — try again.", 'error'),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl italic text-ink">{project.name}</h1>
        <div className="flex items-center gap-3">
          <select
            value={project.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={updateProject.isPending}
            aria-label="Project status"
            className="rounded-md border border-border bg-paper-raised px-2.5 py-1.5 text-sm capitalize text-ink focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-60"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
          <button
            onClick={handleArchive}
            disabled={archiveProject.isPending}
            className="text-sm font-medium text-negative hover:underline disabled:opacity-60"
          >
            Archive
          </button>
        </div>
      </div>
      <ProjectTotalsCard totals={project.totals} />
      <IncomeList projectId={id} />
      <ExpenseList projectId={id} />
    </div>
  );
}
