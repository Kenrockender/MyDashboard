'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useProjects, useCreateProject } from '@/hooks/use-projects';
import { useClients } from '@/hooks/use-clients';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, FormPanel } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { SearchInput } from '@/components/ui/search-input';
import { ListSkeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { useToast } from '@/lib/toast-context';
import { inputClass } from '@/lib/ui';

const STATUSES = ['active', 'on_hold', 'completed'];

const STATUS_RULE: Record<string, string> = {
  active: 'bg-accent',
  on_hold: 'bg-negative',
  completed: 'bg-border',
};

export default function ProjectsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const { data: projects, isLoading, isError, refetch } = useProjects({
    search: debouncedSearch,
    status: statusFilter || undefined,
    clientId: clientFilter || undefined,
  });
  const { data: clients } = useClients();
  const createProject = useCreateProject();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [status, setStatus] = useState(STATUSES[0]);
  const [startDate, setStartDate] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    createProject.mutate(
      { name: name.trim(), clientId: clientId || undefined, status, startDate: startDate || undefined },
      {
        onSuccess: () => {
          setName('');
          setClientId('');
          setStatus(STATUSES[0]);
          setStartDate('');
          showToast('Project added.');
        },
        onError: () => showToast("Couldn't add project — try again.", 'error'),
      },
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        subtitle="Select a project to read its ledger."
      />

      <FormPanel title="New project" onSubmit={handleSubmit}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_1.2fr_1fr_1fr_auto] lg:items-end">
          <Field label="Name">
            <input
              placeholder="Project name"
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
              {clients?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={inputClass}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
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
          <Button type="submit" disabled={createProject.isPending} className="sm:col-span-2 lg:col-span-1">
            Add project
          </Button>
        </div>
      </FormPanel>

      <div className="flex flex-wrap gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          label="Search projects"
          placeholder="Search projects"
          className="min-w-[12rem] flex-1"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
          className={inputClass}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
        <select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          aria-label="Filter by client"
          className={inputClass}
        >
          <option value="">All clients</option>
          {clients?.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {isLoading && <ListSkeleton />}
      {isError && <ErrorState message="Couldn't load projects." onRetry={refetch} />}
      {!isLoading && !isError && (
        <div className="overflow-hidden rounded-[14px] border border-border bg-paper-raised">
          <div className="border-b border-hair px-5 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
            Project
          </div>
          {projects?.length === 0 && (
            <p className="px-5 py-6 text-center text-sm text-ink-muted">
              No projects yet — add your first one above.
            </p>
          )}
          {projects?.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="flex items-start justify-between gap-4 border-t border-hair px-5 py-3.5 transition-colors first:border-t-0 hover:bg-hair/40"
            >
              <span className="flex min-w-0 gap-3">
                <span
                  aria-hidden
                  className={`mt-0.5 w-[3px] flex-none self-stretch rounded-full ${
                    STATUS_RULE[p.status] ?? 'bg-border'
                  }`}
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink">{p.name}</span>
                  <span className="mt-0.5 block text-xs text-ink-muted">
                    {clients?.find((client) => client.id === p.clientId)?.name ?? 'No client'}
                  </span>
                </span>
              </span>
              <Badge>{p.status}</Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
