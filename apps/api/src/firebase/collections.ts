import { Timestamp, type DocumentSnapshot } from 'firebase-admin/firestore';

export const COLLECTIONS = {
  clients: 'clients',
  projects: 'projects',
  income: 'income',
  expenses: 'expenses',
} as const;

// Firestore returns Timestamps; the API contract (04-API-Specification.md) is
// JSON dates, and the shared calculation helpers expect real Date objects.
function fromFirestore(value: unknown): unknown {
  if (value instanceof Timestamp) return value.toDate();
  return value;
}

export function docToEntity<T>(doc: DocumentSnapshot): T {
  const data = doc.data() ?? {};
  const mapped = Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, fromFirestore(value)]),
  );
  return { id: doc.id, ...mapped } as T;
}
