import { Timestamp } from 'firebase-admin/firestore';

type Doc = Record<string, unknown> & { id: string };

interface Filter {
  field: string;
  value: unknown;
}

let nextId = 1;

function toMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  return Number(new Date(value as string));
}

function snapshotOf(doc: Doc | undefined) {
  if (!doc) return { exists: false, id: '', data: () => undefined };
  const { id, ...fields } = doc;
  return { exists: true, id, data: () => fields };
}

class FakeQuery {
  constructor(
    protected getDocs: () => Doc[],
    private filters: Filter[] = [],
    private sort?: { field: string; desc: boolean },
  ) {}

  where(field: string, _op: string, value: unknown) {
    return new FakeQuery(
      this.getDocs,
      [...this.filters, { field, value }],
      this.sort,
    );
  }

  orderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
    return new FakeQuery(this.getDocs, this.filters, {
      field,
      desc: direction === 'desc',
    });
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
    return Promise.resolve({ docs: result.map((d) => snapshotOf(d)) });
  }
}

class FakeCollection extends FakeQuery {
  constructor(private store: Doc[]) {
    super(() => store);
  }

  doc(id: string) {
    const find = () => this.store.find((d) => d.id === id);
    return {
      get: () => Promise.resolve(snapshotOf(find())),
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
    const id = `fake_${nextId++}`;
    const doc: Doc = { id, ...data };
    this.store.push(doc);
    return Promise.resolve({
      id,
      get: () => Promise.resolve(snapshotOf(doc)),
    });
  }
}

/**
 * In-memory stand-in for the Firestore client. Supports the read and write
 * paths the services use (where/orderBy/get, doc get/update/delete, add).
 * Seed with `{ collectionName: [{ id, ...fields }] }` — writes made during a
 * test are visible to subsequent reads against the same instance.
 */
export function createFakeFirestore(seed: Record<string, Doc[]> = {}) {
  const stores = new Map<string, Doc[]>(
    Object.entries(seed).map(([name, docs]) => [name, [...docs]]),
  );

  return {
    db: {
      collection: (name: string) => {
        if (!stores.has(name)) stores.set(name, []);
        return new FakeCollection(stores.get(name)!);
      },
      settings: () => {},
    },
  };
}
