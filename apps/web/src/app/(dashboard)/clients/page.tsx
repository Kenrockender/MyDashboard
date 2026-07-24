'use client';
import { useState } from 'react';
import { useClients, useCreateClient, useUpdateClient, type Client } from '@/hooks/use-clients';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { ListSkeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { useToast } from '@/lib/toast-context';

const inputClass =
  'rounded-md border border-border bg-paper-raised px-2.5 py-1.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent/40';

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
      <li className="px-4 py-2.5">
        <form onSubmit={handleSave} className="flex flex-wrap items-center gap-2">
          <input
            aria-label="Client name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`${inputClass} flex-1 min-w-[8rem]`}
          />
          <input
            type="email"
            aria-label="Email"
            placeholder="Email (optional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`${inputClass} flex-1 min-w-[8rem]`}
          />
          <input
            type="tel"
            aria-label="Phone"
            placeholder="Phone (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={`${inputClass} flex-1 min-w-[8rem]`}
          />
          <input
            aria-label="Company"
            placeholder="Company (optional)"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className={`${inputClass} flex-1 min-w-[8rem]`}
          />
          <button
            type="submit"
            disabled={updateClient.isPending}
            className="text-sm font-medium text-accent hover:underline disabled:opacity-60"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setName(client.name);
              setEmail(client.email ?? '');
              setPhone(client.phone ?? '');
              setCompany(client.company ?? '');
              setEditing(false);
            }}
            className="text-sm font-medium text-ink-muted hover:underline"
          >
            Cancel
          </button>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-4 px-4 py-3">
      <div className="text-ink">
        <span>{client.name}</span>
        {client.company && <span className="ml-2 text-sm text-ink-muted">{client.company}</span>}
        {(client.email || client.phone) && (
          <span className="ml-2 text-sm text-ink-muted">{[client.email, client.phone].filter(Boolean).join(' · ')}</span>
        )}
      </div>
      <button
        onClick={() => setEditing(true)}
        className="text-sm font-medium text-ink-muted hover:text-ink hover:underline"
      >
        Edit
      </button>
    </li>
  );
}

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const { data: clients, isLoading, isError, refetch } = useClients(debouncedSearch);
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
      <h1 className="font-display text-2xl italic text-ink">Clients</h1>

      <form onSubmit={handleSubmit} className="flex flex-wrap gap-2">
        <input
          placeholder="Client name"
          aria-label="Client name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`${inputClass} flex-1 min-w-[10rem]`}
        />
        <input
          type="email"
          placeholder="Email (optional)"
          aria-label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`${inputClass} flex-1 min-w-[10rem]`}
        />
        <input
          type="tel"
          placeholder="Phone (optional)"
          aria-label="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={`${inputClass} flex-1 min-w-[10rem]`}
        />
        <input
          placeholder="Company (optional)"
          aria-label="Company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className={`${inputClass} flex-1 min-w-[10rem]`}
        />
        <button
          type="submit"
          disabled={createClient.isPending}
          className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-border/30 disabled:opacity-60"
        >
          Add client
        </button>
      </form>

      <input
        placeholder="Search clients…"
        aria-label="Search clients"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={`${inputClass} w-full max-w-sm`}
      />
      {isLoading && <ListSkeleton />}
      {isError && <ErrorState message="Couldn't load clients." onRetry={refetch} />}
      {!isLoading && !isError && (
        <ul className="divide-y divide-border rounded-lg border border-border bg-paper-raised">
          {clients?.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-ink-muted">No clients yet — add your first one above.</li>
          )}
          {clients?.map((c) => (
            <ClientRow key={c.id} client={c} />
          ))}
        </ul>
      )}
    </div>
  );
}
