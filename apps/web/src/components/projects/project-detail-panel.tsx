'use client';

import { useState } from 'react';
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
import { InvoiceList } from '@/components/projects/invoice-list';
import { TimeEntryList } from '@/components/projects/time-entry-list';
import { SaleSummary } from '@/components/projects/sale-summary';
import { Badge } from '@/components/ui/badge';
import { Button, LinkButton } from '@/components/ui/button';
import { Field, FormPanel } from '@/components/ui/field';
import { Select } from '@/components/ui/select';
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
          <Select
            value={clientId}
            onChange={setClientId}
            placeholder="No client"
            options={clients?.map((client) => ({ value: client.id, label: client.name })) ?? []}
          />
        </Field>
        {project.dealType !== 'one_time' && (
          <Field label="Status">
            <Select
              value={status}
              onChange={setStatus}
              options={STATUSES.map((value) => ({ value, label: value.replace('_', ' ') }))}
            />
          </Field>
        )}
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

export function ProjectDetailPanel({
  projectId,
  onBack,
}: {
  projectId: string;
  onBack: () => void;
}) {
  const { data: project, isLoading, isError, refetch } = useProject(projectId);
  const { data: clients } = useClients();
  const archiveProject = useArchiveProject(projectId);
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);

  const backLink = (
    <button
      onClick={onBack}
      className="mb-1 inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
    >
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" aria-hidden="true">
        <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Projects
    </button>
  );

  if (isError) {
    return (
      <div>
        {backLink}
        <ErrorState message="Couldn't load this project." onRetry={refetch} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {backLink}
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-28 rounded-[14px]" />
      </div>
    );
  }

  if (!project) {
    return (
      <div>
        {backLink}
        <p className="text-sm text-ink-muted">Project not found.</p>
      </div>
    );
  }

  function handleArchive() {
    if (!project) return;
    if (!window.confirm(`Archive "${project.name}"? It will be hidden from your projects list.`)) return;
    archiveProject.mutate(undefined, {
      onSuccess: () => {
        showToast('Project archived.');
        onBack();
      },
      onError: () => showToast("Couldn't archive project — try again.", 'error'),
    });
  }

  const clientName = clients?.find((c) => c.id === project.clientId)?.name;
  const isOneTime = project.dealType === 'one_time';

  return (
    <div className="space-y-6">
      {backLink}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-[28px] italic leading-[1.05] tracking-[-0.01em] text-ink sm:text-[33px]">
              {project.name}
            </h1>
            {isOneTime ? <Badge tone="neutral">One-time sale</Badge> : <Badge>{project.status}</Badge>}
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
        <ProjectDetailsForm project={project} projectId={projectId} onClose={() => setEditing(false)} />
      )}

      <ProjectTotalsCard totals={project.totals} />

      {isOneTime ? (
        <SaleSummary projectId={projectId} />
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            <IncomeList projectId={projectId} />
            <ExpenseList projectId={projectId} />
          </div>
          <InvoiceList projectId={projectId} />
          <TimeEntryList projectId={projectId} />
        </>
      )}
    </div>
  );
}
