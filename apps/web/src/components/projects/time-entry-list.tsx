'use client';
import { useEffect, useRef, useState } from 'react';
import {
  useTimeEntries,
  useCreateTimeEntry,
  useUpdateTimeEntry,
  useLogTimeEntryAsIncome,
  useDeleteTimeEntry,
  type TimeEntry,
} from '@/hooks/use-time-entries';
import { Badge } from '@/components/ui/badge';
import { Button, LinkButton } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { CurrencySelect } from '@/components/ui/currency-select';
import { ListSkeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { useToast } from '@/lib/toast-context';
import { inputClass, money, type Currency } from '@/lib/ui';

interface EntryFormValues {
  hours: number;
  description?: string;
  date: string;
  hourlyRate?: number;
  currency: Currency;
}

function TimeEntryRow({
  entry,
  onUpdate,
  onLogIncome,
  onDelete,
}: {
  entry: TimeEntry;
  onUpdate: (id: string, dto: EntryFormValues, onDone: () => void) => void;
  onLogIncome: (entry: TimeEntry) => void;
  onDelete: (entry: TimeEntry) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [hours, setHours] = useState(String(entry.hours));
  const [description, setDescription] = useState(entry.description ?? '');
  const [date, setDate] = useState(entry.date.slice(0, 10));
  const [hourlyRate, setHourlyRate] = useState(entry.hourlyRate ? String(entry.hourlyRate) : '');
  const [currency, setCurrency] = useState<Currency>(entry.currency);

  const isLogged = entry.status === 'logged';

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!hours || !date) return;
    onUpdate(
      entry.id,
      {
        hours: Number(hours),
        description: description || undefined,
        date,
        hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
        currency,
      },
      () => setEditing(false),
    );
  }

  if (editing) {
    return (
      <li className="border-t border-hair px-5 py-4">
        <form onSubmit={handleSave} className="grid gap-3 sm:grid-cols-2">
          <Field label="Hours">
            <input
              type="number"
              step="0.25"
              required
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Date">
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Hourly rate (optional)">
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              className={inputClass}
            />
          </Field>
          <CurrencySelect value={currency} onChange={setCurrency} />
          <Field label="Description" className="sm:col-span-2">
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
            />
          </Field>
          <div className="flex items-center gap-4 sm:col-span-2">
            <Button type="submit">Save</Button>
            <LinkButton type="button" onClick={() => setEditing(false)}>
              Cancel
            </LinkButton>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="group flex items-center justify-between gap-3 border-t border-hair px-5 py-3">
      <div className="min-w-0">
        <div className="truncate text-sm text-ink">{entry.description || 'Time logged'}</div>
        <div className="mt-0.5 text-xs text-ink-muted">
          {entry.date.slice(0, 10)} · {entry.hours}h
          {entry.hourlyRate ? ` @ ${money(entry.hourlyRate, entry.currency)}/h` : ''}
        </div>
      </div>
      <div className="flex flex-none items-center gap-4">
        <Badge tone={isLogged ? 'positive' : 'neutral'}>{isLogged ? 'logged' : 'unlogged'}</Badge>
        <div className="flex gap-3 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
          {!isLogged && entry.hourlyRate && (
            <LinkButton tone="accent" onClick={() => onLogIncome(entry)}>
              Log as income
            </LinkButton>
          )}
          {!isLogged && (
            <>
              <LinkButton onClick={() => setEditing(true)}>Edit</LinkButton>
              <LinkButton
                tone="negative"
                onClick={() => onDelete(entry)}
                aria-label={`Delete time entry of ${entry.hours} hours`}
              >
                Delete
              </LinkButton>
            </>
          )}
        </div>
      </div>
    </li>
  );
}

export function TimeEntryList({ projectId }: { projectId: string }) {
  const { data: entries, isLoading, isError, refetch } = useTimeEntries(projectId);
  const createEntry = useCreateTimeEntry(projectId);
  const updateEntry = useUpdateTimeEntry(projectId);
  const logIncome = useLogTimeEntryAsIncome(projectId);
  const deleteEntry = useDeleteTimeEntry(projectId);
  const { showToast } = useToast();

  const [hours, setHours] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD');

  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerStartRef = useRef<number | null>(null);

  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - (timerStartRef.current ?? Date.now())) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  const totalHours = (entries ?? []).reduce((sum, e) => sum + Number(e.hours), 0);

  function handleStartTimer() {
    timerStartRef.current = Date.now();
    setElapsedSeconds(0);
    setTimerRunning(true);
  }

  function handleStopTimer() {
    setTimerRunning(false);
    const trackedHours = elapsedSeconds / 3600;
    setHours(trackedHours > 0 ? trackedHours.toFixed(2) : '');
    setDate(new Date().toISOString().slice(0, 10));
    timerStartRef.current = null;
    setElapsedSeconds(0);
  }

  function formatElapsed(totalSeconds: number) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hours || !date) return;
    createEntry.mutate(
      {
        hours: Number(hours),
        description: description || undefined,
        date,
        hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
        currency,
      },
      {
        onSuccess: () => {
          setHours('');
          setDescription('');
          setDate('');
          setHourlyRate('');
          showToast('Time logged.');
        },
        onError: () => showToast("Couldn't log time — try again.", 'error'),
      },
    );
  }

  function handleUpdate(id: string, dto: EntryFormValues, onDone: () => void) {
    updateEntry.mutate(
      { id, dto },
      {
        onSuccess: () => {
          onDone();
          showToast('Time entry updated.');
        },
        onError: () => showToast("Couldn't update this entry — try again.", 'error'),
      },
    );
  }

  function handleLogIncome(entry: TimeEntry) {
    if (
      !window.confirm(
        `Log ${entry.hours}h at ${money(entry.hourlyRate ?? 0, entry.currency)}/h as a new income record?`,
      )
    )
      return;
    logIncome.mutate(entry.id, {
      onSuccess: () => showToast('Logged as income.'),
      onError: () => showToast("Couldn't log this entry as income — try again.", 'error'),
    });
  }

  function handleDelete(entry: TimeEntry) {
    if (!window.confirm(`Delete this ${entry.hours}h time entry?`)) return;
    deleteEntry.mutate(entry.id, {
      onSuccess: () => showToast('Time entry deleted.'),
      onError: () => showToast("Couldn't delete this entry — try again.", 'error'),
    });
  }

  return (
    <div className="overflow-hidden rounded-[14px] border border-border bg-paper-raised">
      <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-4">
        <h2 className="font-display text-lg italic text-ink sm:text-xl">Time tracking</h2>
        {entries && entries.length > 0 && (
          <span className="font-mono text-xs text-ink-muted">{totalHours}h logged</span>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-hair px-5 py-3">
        {timerRunning ? (
          <>
            <span className="font-mono text-lg tabular-nums text-ink">
              {formatElapsed(elapsedSeconds)}
            </span>
            <Button type="button" variant="secondary" onClick={handleStopTimer}>
              Stop timer
            </Button>
          </>
        ) : (
          <>
            <span className="text-sm text-ink-muted">
              Or track live instead of entering hours by hand.
            </span>
            <Button type="button" variant="secondary" onClick={handleStartTimer}>
              Start timer
            </Button>
          </>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3 border-t border-hair px-5 py-4 sm:grid-cols-2">
        <Field label="Hours">
          <input
            type="number"
            step="0.25"
            placeholder="0"
            required
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Date">
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Hourly rate (optional)">
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
            className={inputClass}
          />
        </Field>
        <CurrencySelect value={currency} onChange={setCurrency} />
        <Field label="Description" className="sm:col-span-2">
          <input
            placeholder="What did you work on"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Button type="submit" disabled={createEntry.isPending} className="justify-self-start">
          Log time
        </Button>
      </form>

      {isLoading && <ListSkeleton rows={2} />}
      {isError && (
        <div className="px-5 py-4">
          <ErrorState message="Couldn't load time entries." onRetry={refetch} />
        </div>
      )}
      {!isLoading && !isError && (
        <ul className="m-0 list-none p-0">
          {entries?.length === 0 && (
            <li className="border-t border-hair px-5 py-5 text-center text-sm text-ink-muted">
              No time logged yet.
            </li>
          )}
          {entries?.map((e) => (
            <TimeEntryRow
              key={e.id}
              entry={e}
              onUpdate={handleUpdate}
              onLogIncome={handleLogIncome}
              onDelete={handleDelete}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
