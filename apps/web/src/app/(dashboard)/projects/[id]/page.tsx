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
import { Badge } from '@/components/ui/badge';
import { Button, LinkButton } from '@/components/ui/button';
import { Field, FormPanel } from '@/components/ui/field';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { useToast } from '@/lib/toast-context';
import { inputClass } from '@/lib/ui';

const STATUSES = ['active', 'on_hold', 'completed'];

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
    <FormPanel title="Edit project" onSubmit={handleSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Project name">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Client">
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className={inputClass}
          >
            <option value="">No client</option>
            {clients?.map((client) => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={inputClass}
          >
            {STATUSES.map((value) => (
              <option key={value} value={value}>{value.replace('_', ' ')}</option>
            ))}
          </select>
        </Field>
        <Field label="Start date">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={inputClass}
          />
        </Field>
        <div className="flex items-center gap-4 sm:col-span-2">
          <Button type="submit" disabled={updateProject.isPending}>
            Save changes
          </Button>
          <LinkButton type="button" onClick={onClose}>
            Cancel
          </LinkButton>
        </div>
      </div>
    </FormPanel>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading, isError, refetch } = useProject(id);
  const { data: clients } = useClients();
  const archiveProject = useArchiveProject(id);
  const { showToast } = useToast();
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  if (isError) return <ErrorState message="Couldn't load this project." onRetry={refetch} />;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-28 rounded-[14px]" />
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

  const clientName = clients?.find((c) => c.id === project.clientId)?.name;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-[28px] italic leading-[1.05] tracking-[-0.01em] text-ink sm:text-[33px]">
              {project.name}
            </h1>
            <Badge>{project.status}</Badge>
          </div>
          <p className="mt-1.5 text-sm text-ink-muted">Client · {clientName ?? 'None'}</p>
        </div>
        <div className="flex items-center gap-4">
          <LinkButton onClick={() => setEditing((value) => !value)}>
            {editing ? 'Cancel edit' : 'Edit details'}
          </LinkButton>
          <LinkButton tone="negative" onClick={handleArchive} disabled={archiveProject.isPending}>
            Archive
          </LinkButton>
        </div>
      </div>

      {editing && (
        <ProjectDetailsForm project={project} projectId={id} onClose={() => setEditing(false)} />
      )}

      <ProjectTotalsCard totals={project.totals} />

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <IncomeList projectId={id} />
        <ExpenseList projectId={id} />
      </div>
    </div>
  );
}
