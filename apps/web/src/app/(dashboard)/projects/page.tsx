'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useProjects, useCreateProject, type DealType } from '@/hooks/use-projects';
import { useClients } from '@/hooks/use-clients';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, FormPanel } from '@/components/ui/field';
import { CurrencySelect } from '@/components/ui/currency-select';
import { Select } from '@/components/ui/select';
import { PageHeader } from '@/components/ui/page-header';
import { SearchInput } from '@/components/ui/search-input';
import { ListSkeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { LoadMoreButton } from '@/components/ui/load-more-button';
import { ProjectDetailPanel } from '@/components/projects/project-detail-panel';
import { useToast } from '@/lib/toast-context';
import { inputClass, type Currency } from '@/lib/ui';

const STATUSES = ['active', 'on_hold', 'completed'];
const DEAL_TYPES: { value: DealType; label: string }[] = [
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'one_time', label: 'One-time sale' },
];

const STATUS_RULE: Record<string, string> = {
  active: 'bg-accent',
  on_hold: 'bg-negative',
  completed: 'bg-border',
};

/** Desktop keeps the list visible and swaps the detail panel in place; below this width there's no room, so rows navigate to a real page instead. */
const DESKTOP_QUERY = '(min-width: 1024px)';

function NewProjectForm() {
  const { data: clients } = useClients();
  const createProject = useCreateProject();
  const { showToast } = useToast();

  const [dealType, setDealType] = useState<DealType>('ongoing');
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [status, setStatus] = useState(STATUSES[0]);
  const [startDate, setStartDate] = useState('');
  const [saleAmount, setSaleAmount] = useState('');
  const [saleCurrency, setSaleCurrency] = useState<Currency>('USD');
  const [cost, setCost] = useState('');
  const [budget, setBudget] = useState('');
  const [budgetCurrency, setBudgetCurrency] = useState<Currency>('USD');

  function reset() {
    setName('');
    setClientId('');
    setStatus(STATUSES[0]);
    setStartDate('');
    setSaleAmount('');
    setCost('');
    setBudget('');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    createProject.mutate(
      {
        name: name.trim(),
        clientId: clientId || undefined,
        dealType,
        startDate: startDate || undefined,
        ...(dealType === 'one_time'
          ? {
              saleAmount: saleAmount ? Number(saleAmount) : undefined,
              saleCurrency,
              cost: cost ? Number(cost) : undefined,
            }
          : {
              status,
              budget: budget ? Number(budget) : undefined,
              budgetCurrency: budget ? budgetCurrency : undefined,
            }),
      },
      {
        onSuccess: () => {
          reset();
          showToast('Project added.');
        },
        onError: () => showToast("Couldn't add project — try again.", 'error'),
      },
    );
  }

  return (
    <FormPanel title="New project" onSubmit={handleSubmit}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.1fr_1.1fr_1fr] lg:items-end">
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
          <Select
            value={clientId}
            onChange={setClientId}
            placeholder="No client"
            options={clients?.map((c) => ({ value: c.id, label: c.name })) ?? []}
          />
        </Field>
        <Field label="Type">
          <Select
            value={dealType}
            onChange={(v) => setDealType(v as DealType)}
            options={DEAL_TYPES}
          />
        </Field>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
        {dealType === 'one_time' ? (
          <>
            <Field label="Sale amount">
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={saleAmount}
                onChange={(e) => setSaleAmount(e.target.value)}
                className={inputClass}
              />
            </Field>
            <CurrencySelect value={saleCurrency} onChange={setSaleCurrency} />
            <Field label="Cost (optional)">
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className={inputClass}
              />
            </Field>
          </>
        ) : (
          <>
            <Field label="Status">
              <Select
                value={status}
                onChange={setStatus}
                options={STATUSES.map((s) => ({ value: s, label: s.replace('_', ' ') }))}
              />
            </Field>
            <Field label="Budget (optional)">
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className={inputClass}
              />
            </Field>
            <CurrencySelect value={budgetCurrency} onChange={setBudgetCurrency} />
          </>
        )}
        <Field label="Start date">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Button type="submit" disabled={createProject.isPending}>
          Add project
        </Button>
      </div>
    </FormPanel>
  );
}

export default function ProjectsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('id');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [dealTypeFilter, setDealTypeFilter] = useState<DealType | ''>('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useProjects({
    search: debouncedSearch,
    status: statusFilter || undefined,
    clientId: clientFilter || undefined,
    dealType: dealTypeFilter || undefined,
  });
  const projects = data?.pages.flatMap((page) => page.items);
  const { data: clients } = useClients();

  function handleRowClick(e: React.MouseEvent, id: string) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    if (window.matchMedia(DESKTOP_QUERY).matches) {
      e.preventDefault();
      router.replace(`/projects?id=${id}`, { scroll: false });
    }
  }

  return (
    <div className="lg:grid lg:grid-cols-[380px_1fr] lg:items-start lg:gap-6">
      <div className={`space-y-6 ${selectedId ? 'hidden lg:block' : ''}`}>
        <PageHeader title="Projects" subtitle="Select a project to read its ledger." />

        <NewProjectForm />

        <div className="flex flex-wrap gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            label="Search projects"
            placeholder="Search projects"
            className="min-w-[12rem] flex-1"
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            aria-label="Filter by status"
            placeholder="All statuses"
            className="w-auto"
            options={STATUSES.map((s) => ({ value: s, label: s.replace('_', ' ') }))}
          />
          <Select
            value={clientFilter}
            onChange={setClientFilter}
            aria-label="Filter by client"
            placeholder="All clients"
            className="w-auto"
            options={clients?.map((c) => ({ value: c.id, label: c.name })) ?? []}
          />
          <Select
            value={dealTypeFilter}
            onChange={(v) => setDealTypeFilter(v as DealType | '')}
            aria-label="Filter by type"
            placeholder="All types"
            className="w-auto"
            options={DEAL_TYPES}
          />
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
                onClick={(e) => handleRowClick(e, p.id)}
                className={`flex items-start justify-between gap-4 border-t border-hair px-5 py-3.5 transition-colors first:border-t-0 hover:bg-hair/40 ${
                  selectedId === p.id ? 'bg-hair/40' : ''
                }`}
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
                {p.dealType === 'one_time' ? (
                  <Badge tone="neutral">One-time sale</Badge>
                ) : (
                  <Badge>{p.status}</Badge>
                )}
              </Link>
            ))}
            {hasNextPage && (
              <LoadMoreButton onClick={() => fetchNextPage()} loading={isFetchingNextPage} />
            )}
          </div>
        )}
      </div>

      {selectedId && (
        <div className="hidden lg:block">
          <ProjectDetailPanel
            projectId={selectedId}
            onBack={() => router.replace('/projects', { scroll: false })}
          />
        </div>
      )}
    </div>
  );
}
