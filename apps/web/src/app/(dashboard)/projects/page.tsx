'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useProjects, useCreateProject } from '@/hooks/use-projects';
import { useClients } from '@/hooks/use-clients';
import { Badge } from '@/components/ui/badge';
import { ListSkeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { useToast } from '@/lib/toast-context';

const STATUSES = ['active', 'on_hold', 'completed'];

const inputClass =
  'rounded-md border border-border bg-paper-raised px-2.5 py-1.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent/40';

export default function ProjectsPage() {
  const { data: projects, isLoading, isError, refetch } = useProjects();
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
      <h1 className="font-display text-2xl italic text-ink">Projects</h1>

      <form onSubmit={handleSubmit} className="flex flex-wrap gap-2">
        <input
          placeholder="Project name"
          aria-label="Project name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`${inputClass} flex-1 min-w-[10rem]`}
        />
        <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          aria-label="Client"
          className={inputClass}
        >
          <option value="">No client</option>
          {clients?.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Status"
          className={inputClass}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
        <input
          type="date"
          aria-label="Start date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className={inputClass}
        />
        <button
          type="submit"
          disabled={createProject.isPending}
          className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-border/30 disabled:opacity-60"
        >
          Add project
        </button>
      </form>

      {isLoading && <ListSkeleton />}
      {isError && <ErrorState message="Couldn't load projects." onRetry={refetch} />}
      {!isLoading && !isError && (
        <ul className="divide-y divide-border rounded-lg border border-border bg-paper-raised">
          {projects?.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-ink-muted">No projects yet — add your first one above.</li>
          )}
          {projects?.map((p) => (
            <li key={p.id}>
              <Link
                href={`/projects/${p.id}`}
                className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-border/20"
              >
                <span className="font-medium text-ink">{p.name}</span>
                <Badge>{p.status}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
