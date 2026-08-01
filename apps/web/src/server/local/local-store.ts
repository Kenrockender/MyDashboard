import { Timestamp } from 'firebase-admin/firestore';
import { seedLocalData } from './local-seed';

/**
 * In-memory stand-in for the Firestore client, used only when LOCAL_MODE is
 * on. Unlike the test-only fake in `../testing/fake-firestore`, this one is a
 * process-wide singleton pre-loaded with demo data, so the dev server has
 * something to show without any Firebase project, emulator, or sign-in.
 *
 * Data lives in memory: it resets whenever the dev server restarts. That's
 * the point — it's a scratch pad for trying the UI, not a database.
 *
 * Only the operations the services actually use are implemented (all `where`
 * clauses in this codebase are `==`, so that's the only operator supported).
 */

type Doc = Record<string, unknown> & { id: string };

interface Filter {
  field: string;
  value: unknown;
}

let nextId = 1;
function generateId() {
  return `local_${nextId++}`;
}

function toMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  return Number(new Date(value as string));
}

function snapshotOf(doc: Doc | undefined) {
  if (!doc) return { exists: false, id: '', data: () => undefined };
  const { id, ...fields } = doc;
  return { exists: true, id, data: () => fields };
}

// Firestore hands back deep copies; without cloning, a caller mutating a
// returned object would silently corrupt the store.
function clone(doc: Doc): Doc {
  return { ...doc };
}

class LocalQuery {
  constructor(
    protected getDocs: () => Doc[],
    private filters: Filter[] = [],
    private sort?: { field: string; desc: boolean },
    private max?: number,
  ) {}

  where(field: string, _op: string, value: unknown): LocalQuery {
    return new LocalQuery(this.getDocs, [...this.filters, { field, value }], this.sort, this.max);
  }

  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): LocalQuery {
    return new LocalQuery(
      this.getDocs,
      this.filters,
      { field, desc: direction === 'desc' },
      this.max,
    );
  }

  limit(count: number): LocalQuery {
    return new LocalQuery(this.getDocs, this.filters, this.sort, count);
  }

  get() {
    let result = this.getDocs().filter((doc) =>
      this.filters.every((f) => doc[f.field] === f.value),
    );
    if (this.sort) {
      const { field, desc } = this.sort;
      result = [...result].sort((a, b) => {
        const av = toMillis(a[field]);
        const bv = toMillis(b[field]);
        return desc ? bv - av : av - bv;
      });
    }
    if (this.max !== undefined) result = result.slice(0, this.max);
    const docs = result.map((d) => snapshotOf(clone(d)));
    return Promise.resolve({ docs, size: docs.length, empty: docs.length === 0 });
  }
}

class LocalCollection extends LocalQuery {
  constructor(private store: Doc[]) {
    super(() => store);
  }

  doc(id: string = generateId()) {
    const find = () => this.store.find((d) => d.id === id);
    return {
      id,
      get: () => Promise.resolve(snapshotOf(find() ? clone(find()!) : undefined)),
      set: (data: Record<string, unknown>) => {
        const existing = find();
        if (existing) Object.assign(existing, data);
        else this.store.push({ id, ...data });
        return Promise.resolve();
      },
      update: (patch: Record<string, unknown>) => {
        const doc = find();
        if (doc) Object.assign(doc, patch);
        return Promise.resolve();
      },
      delete: () => {
        const index = this.store.findIndex((d) => d.id === id);
        if (index !== -1) this.store.splice(index, 1);
        return Promise.resolve();
      },
    };
  }

  add(data: Record<string, unknown>) {
    const id = generateId();
    const doc: Doc = { id, ...data };
    this.store.push(doc);
    return Promise.resolve({
      id,
      get: () => Promise.resolve(snapshotOf(clone(doc))),
    });
  }
}

const stores = new Map<string, Doc[]>();

function collection(name: string) {
  if (!stores.has(name)) stores.set(name, []);
  return new LocalCollection(stores.get(name)!);
}

const localDb = {
  collection,
  settings: () => {},
  batch() {
    const ops: Array<() => void> = [];
    return {
      set(
        ref: { id: string; set: (d: Record<string, unknown>) => void },
        data: Record<string, unknown>,
      ) {
        ops.push(() => ref.set(data));
      },
      commit() {
        for (const op of ops) op();
        return Promise.resolve();
      },
    };
  },
};

/**
 * Builds the local store and loads it with demo data. Seeding happens here
 * rather than at module scope so importing this file is side-effect free —
 * production builds import it but never call this.
 */
export function createLocalDb(userId: string) {
  seedLocalData({
    addDoc(collectionName: string, data: Record<string, unknown>) {
      if (!stores.has(collectionName)) stores.set(collectionName, []);
      const id = generateId();
      stores.get(collectionName)!.push({ id, ...data });
      return id;
    },
    userId,
  });
  return localDb;
}
