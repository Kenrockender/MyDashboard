type Doc = Record<string, unknown> & { id: string };

interface Filter {
  field: string;
  value: unknown;
}

function snapshotOf(doc: Doc | undefined) {
  if (!doc) return { exists: false, id: '', data: () => undefined };
  const { id, ...fields } = doc;
  return { exists: true, id, data: () => fields };
}

class FakeQuery {
  constructor(
    private docs: Doc[],
    private filters: Filter[] = [],
    private sort?: { field: string; desc: boolean },
  ) {}

  where(field: string, _op: string, value: unknown) {
    return new FakeQuery(this.docs, [...this.filters, { field, value }], this.sort);
  }

  orderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
    return new FakeQuery(this.docs, this.filters, { field, desc: direction === 'desc' });
  }

  get() {
    let result = this.docs.filter((doc) =>
      this.filters.every((f) => doc[f.field] === f.value),
    );
    if (this.sort) {
      const { field, desc } = this.sort;
      result = [...result].sort((a, b) => {
        const av = Number(new Date(a[field] as string));
        const bv = Number(new Date(b[field] as string));
        return desc ? bv - av : av - bv;
      });
    }
    return Promise.resolve({ docs: result.map((d) => snapshotOf(d)) });
  }
}

class FakeCollection extends FakeQuery {
  constructor(private all: Doc[]) {
    super(all);
  }

  doc(id: string) {
    return {
      get: () => Promise.resolve(snapshotOf(this.all.find((d) => d.id === id))),
    };
  }
}

/**
 * In-memory stand-in for the Firestore client, covering only the read paths the
 * services use. Seed with `{ collectionName: [{ id, ...fields }] }`.
 */
export function createFakeFirestore(seed: Record<string, Doc[]>) {
  return {
    db: {
      collection: (name: string) => new FakeCollection(seed[name] ?? []),
    },
  };
}
