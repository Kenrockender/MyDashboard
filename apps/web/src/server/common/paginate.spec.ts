import { paginate } from './paginate';

function items(n: number) {
  // newest first, matching how services sort before paginating
  return Array.from({ length: n }, (_, i) => ({
    id: `item_${n - i}`,
    createdAt: new Date(2026, 0, n - i),
  }));
}

describe('paginate', () => {
  it('returns the first page and a cursor when more items remain', () => {
    const page = paginate(items(10), { limit: 4 });
    expect(page.items.map((i) => i.id)).toEqual(['item_10', 'item_9', 'item_8', 'item_7']);
    expect(page.nextCursor).toBe(page.items[3].createdAt.toISOString());
  });

  it('returns the next page starting after the given cursor', () => {
    const all = items(10);
    const first = paginate(all, { limit: 4 });
    const second = paginate(all, { limit: 4, cursor: first.nextCursor! });
    expect(second.items.map((i) => i.id)).toEqual(['item_6', 'item_5', 'item_4', 'item_3']);
    expect(second.nextCursor).toBeTruthy();
  });

  it('returns nextCursor: null on the last page', () => {
    const all = items(10);
    const first = paginate(all, { limit: 4 });
    const second = paginate(all, { limit: 4, cursor: first.nextCursor! });
    const third = paginate(all, { limit: 4, cursor: second.nextCursor! });
    expect(third.items.map((i) => i.id)).toEqual(['item_2', 'item_1']);
    expect(third.nextCursor).toBeNull();
  });

  it('returns nextCursor: null when everything fits in one page', () => {
    const page = paginate(items(3), { limit: 25 });
    expect(page.items).toHaveLength(3);
    expect(page.nextCursor).toBeNull();
  });

  it('returns an empty page past the end instead of throwing', () => {
    const all = items(3);
    const page = paginate(all, { limit: 25, cursor: all[2].createdAt.toISOString() });
    expect(page.items).toEqual([]);
    expect(page.nextCursor).toBeNull();
  });

  it('defaults to DEFAULT_PAGE_SIZE when no limit is given', () => {
    const page = paginate(items(30), {});
    expect(page.items).toHaveLength(25);
    expect(page.nextCursor).toBeTruthy();
  });
});
