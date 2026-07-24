'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  useProject,
  useUpdateProject,
  useArchiveProject,
  type ProjectDetail,
} from '@/hooks/use-projects';
import { useClients } from '@/hooks/use-clients';
import { ProjectTotalsCard } from '@/components/projects/project-totals';
import { IncomeList } from '@/components/projects/income-list';
import { ExpenseList } from '@/components/projects/expense-list';
import { CardSkeleton, Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { useToast } from '@/lib/toast-context';

const STATUSES = ['active', 'on_hold', 'completed'];
const inputClass =
  'rounded-md border border-border bg-paper-raised px-2.5 py-1.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent/40';

function ProjectDetailsForm({
  project,
  projectId,
  onClose,
}: {
  project: ProjectDetail;
  projectId: string;
  onClose: () => void;
}) {
  const { data: clients } = useClients();
  const updateProject = useUpdateProject(projectId);
  const { showToast } = useToast();
  const [name, setName] = useState(project.name);
  const [clientId, setClientId] = useState(project.clientId ?? '');
  const [status, setStatus] = useState(project.status);
  const [startDate, setStartDate] = useState(project.startDate?.slice(0, 10) ?? '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    updateProject.mutate(
      {
        name: name.trim(),
        clientId: clientId || null,
        status,
        startDate: startDate || null,
      },
      {
        onSuccess: () => {
          showToast('Project details updated.');
          onClose();
        },
        onError: () => showToast("Couldn't update this project — try again.", 'error'),
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 rounded-lg border border-border bg-paper-raised p-4 sm:grid-cols-2">
      <label className="grid gap-1 text-sm text-ink">
        Project name
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
      </label>
      <label className="grid gap-1 text-sm text-ink">
        Client
        <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={inputClass}>
          <option value="">No client</option>
          {clients?.map((client) => (
            <option key={client.id} value={client.id}>{client.name}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm text-ink">
        Status
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
          {STATUSES.map((value) => (
            <option key={value} value={value}>{value.replace('_', ' ')}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm text-ink">
        Start date
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className={inputClass}
        />
      </label>
      <div className="flex gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={updateProject.isPending}
          className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-border/30 disabled:opacity-60"
        >
          Save changes
        </button>
        <button type="button" onClick={onClose} className="text-sm font-medium text-ink-muted hover:underline">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading, isError, refetch } = useProject(id);
  const archiveProject = useArchiveProject(id);
  const { showToast } = useToast();
  const router = useRouter();
  const [editing, setEditing] = useState(false);

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

  function handleArchive() {
    if (!project) return;
    if (!window.confirm(`Archive "${project.name}"? It will be hidden from your projects list.`)) return;
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
        <div>
          <h1 className="font-display text-2xl italic text-ink">{project.name}</h1>
          <p className="mt-1 text-sm capitalize text-ink-muted">{project.status.replace('_', ' ')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setEditing((value) => !value)}
            className="text-sm font-medium text-ink-muted hover:text-ink hover:underline"
          >
            {editing ? 'Cancel edit' : 'Edit details'}
          </button>
          <button
            onClick={handleArchive}
            disabled={archiveProject.isPending}
            className="text-sm font-medium text-negative hover:underline disabled:opacity-60"
          >
            Archive
          </button>
        </div>
      </div>
      {editing && <ProjectDetailsForm project={project} projectId={id} onClose={() => setEditing(false)} />}
      <ProjectTotalsCard totals={project.totals} />
      <IncomeList projectId={id} />
      <ExpenseList projectId={id} />
    </div>
  );
}
