'use client';
import { useState } from 'react';
import { useClientsInfinite, useCreateClient, useUpdateClient, type Client } from '@/hooks/use-clients';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { Button, LinkButton } from '@/components/ui/button';
import { Field, FormPanel } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { SearchInput } from '@/components/ui/search-input';
import { ListSkeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { LoadMoreButton } from '@/components/ui/load-more-button';
import { useToast } from '@/lib/toast-context';
import { inputClass } from '@/lib/ui';

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function ClientRow({ client }: { client: Client }) {
  const updateClient = useUpdateClient();
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(client.name);
  const [email, setEmail] = useState(client.email ?? '');
  const [phone, setPhone] = useState(client.phone ?? '');
  const [company, setCompany] = useState(client.company ?? '');

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    updateClient.mutate(
      {
        id: client.id,
        dto: {
          name: name.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          company: company.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          setEditing(false);
          showToast('Client updated.');
        },
        onError: () => showToast("Couldn't update client — try again.", 'error'),
      },
    );
  }

  if (editing) {
    return (
      <li className="border-t border-hair px-5 py-4 first:border-t-0">
        <form onSubmit={handleSave} className="grid gap-3 sm:grid-cols-2">
          <Field label="Name">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Phone">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Company">
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className={inputClass}
            />
          </Field>
          <div className="flex items-center gap-4 sm:col-span-2">
            <Button type="submit" disabled={updateClient.isPending}>
              Save
            </Button>
            <LinkButton
              type="button"
              onClick={() => {
                setName(client.name);
                setEmail(client.email ?? '');
                setPhone(client.phone ?? '');
                setCompany(client.company ?? '');
                setEditing(false);
              }}
            >
              Cancel
            </LinkButton>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="grid grid-cols-[1fr_auto] items-center gap-4 border-t border-hair px-5 py-3.5 first:border-t-0 sm:grid-cols-[1.5fr_1.2fr_1.5fr_auto]">
      <div className="flex min-w-0 items-center gap-3">
        <span className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-full border border-hair bg-accent-soft text-[11.5px] font-semibold text-accent">
          {initials(client.name)}
        </span>
        <span className="truncate text-sm font-medium text-ink">{client.name}</span>
      </div>
      <div className="hidden truncate text-sm text-ink-muted sm:block">
        {client.company || '—'}
      </div>
      <div className="hidden min-w-0 sm:block">
        <div className="truncate text-sm text-ink">{client.email || '—'}</div>
        {client.phone && (
          <div className="mt-0.5 font-mono text-xs text-ink-muted">{client.phone}</div>
        )}
      </div>
      <LinkButton onClick={() => setEditing(true)}>Edit</LinkButton>
    </li>
  );
}

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useClientsInfinite(debouncedSearch);
  const clients = data?.pages.flatMap((page) => page.items);
  const createClient = useCreateClient();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    createClient.mutate(
      {
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        company: company.trim() || undefined,
      },
      {
        onSuccess: () => {
          setName('');
          setEmail('');
          setPhone('');
          setCompany('');
          showToast('Client added.');
        },
        onError: () => showToast("Couldn't add client — try again.", 'error'),
      },
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Clients" subtitle="Add a new relationship, or search the roster." />

      <FormPanel title="Add client" onSubmit={handleSubmit}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.2fr_1.4fr_1fr_1.2fr_auto] lg:items-end">
          <Field label="Name">
            <input
              placeholder="Studio name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              placeholder="name@studio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Phone">
            <input
              type="tel"
              placeholder="+62 …"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Company">
            <input
              placeholder="Company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Button type="submit" disabled={createClient.isPending} className="sm:col-span-2 lg:col-span-1">
            Add client
          </Button>
        </div>
      </FormPanel>

      <SearchInput
        value={search}
        onChange={setSearch}
        label="Search clients"
        className="max-w-sm"
      />

      {isLoading && <ListSkeleton />}
      {isError && <ErrorState message="Couldn't load clients." onRetry={refetch} />}
      {!isLoading && !isError && (
        <div className="overflow-hidden rounded-[14px] border border-border bg-paper-raised">
          <div className="hidden grid-cols-[1.5fr_1.2fr_1.5fr_auto] gap-4 border-b border-hair px-5 py-3 sm:grid">
            {['Client', 'Company', 'Contact'].map((h) => (
              <span
                key={h}
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted"
              >
                {h}
              </span>
            ))}
            <span />
          </div>
          <ul className="m-0 list-none p-0">
            {clients?.length === 0 && (
              <li className="px-5 py-6 text-center text-sm text-ink-muted">
                No clients yet — add your first one above.
              </li>
            )}
            {clients?.map((c) => (
              <ClientRow key={c.id} client={c} />
            ))}
          </ul>
          {hasNextPage && (
            <LoadMoreButton onClick={() => fetchNextPage()} loading={isFetchingNextPage} />
          )}
        </div>
      )}
    </div>
  );
}
