export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

export const DEFAULT_PAGE_SIZE = 25;

/**
 * Slices an already-sorted (newest first) array into a page, keyed off the
 * previous page's last `createdAt`. This paginates in memory after a
 * per-user fetch rather than pushing `limit`/`startAfter` down to the
 * Firestore query itself — at this app's actual scale (one user's own
 * records, not a shared multi-tenant collection) that's simpler, and it
 * still bounds what's rendered and sent over the wire, which is the actual
 * problem unbounded list endpoints had. Revisit with real Firestore cursor
 * queries if this ever needs to scale past a single user's dataset.
 */
export function paginate<T extends { createdAt: Date }>(
  items: T[],
  { cursor, limit = DEFAULT_PAGE_SIZE }: { cursor?: string; limit?: number },
): Page<T> {
  const start = cursor
    ? items.findIndex((item) => new Date(item.createdAt).getTime() < new Date(cursor).getTime())
    : 0;
  const from = start === -1 ? items.length : start;
  const page = items.slice(from, from + limit);
  const hasMore = from + limit < items.length;
  const last = page[page.length - 1];
  return { items: page, nextCursor: hasMore && last ? new Date(last.createdAt).toISOString() : null };
}
