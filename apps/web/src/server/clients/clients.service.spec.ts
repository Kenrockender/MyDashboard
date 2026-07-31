// `clientsService` imports `db` as a module-level singleton (no DI to swap
// in a fake), so the fake Firestore is substituted by mocking the `../firebase`
// module itself. The mock returns a getter so each test's `beforeEach` can
// swap in a fresh fake store before the service reads `db` at call time.
let mockDb: ReturnType<typeof createFakeFirestore>['db'];

jest.mock('../firebase', () => ({
  get db() {
    return mockDb;
  },
}));

import { createFakeFirestore } from '../testing/fake-firestore';
import { clientsService } from './clients.service';
import type { CreateClientDto } from './dto/create-client.dto';

describe('ClientsService.update', () => {
  beforeEach(() => {
    mockDb = createFakeFirestore({
      clients: [
        {
          id: 'client_1',
          userId: 'user_1',
          name: 'Kopi Kita',
          email: 'hello@kopikita.test',
          createdAt: '2026-07-01T00:00:00.000Z',
        },
      ],
    }).db;
  });

  it('applies whitelisted fields', async () => {
    const updated = await clientsService.update('user_1', 'client_1', {
      name: 'Kopi Kita Roastery',
      company: 'Kopi Kita Group',
    });

    expect(updated!.name).toBe('Kopi Kita Roastery');
    expect(updated!.company).toBe('Kopi Kita Group');
    expect(updated!.email).toBe('hello@kopikita.test');
  });

  it('ignores fields outside the DTO whitelist instead of mass-assigning them (regression)', async () => {
    // The PATCH route only casts the request body with `as Partial<CreateClientDto>` —
    // it never runs it through `validateBody`, so nothing stops a caller from
    // sending fields like `userId` here. This pins the fix in clients.service.ts
    // that whitelists the patch instead of spreading the raw dto into Firestore.
    const maliciousPayload = {
      name: 'Renamed via patch',
      userId: 'attacker-uid',
      createdAt: '2020-01-01T00:00:00.000Z',
    } as unknown as Partial<CreateClientDto>;

    const updated = await clientsService.update('user_1', 'client_1', maliciousPayload);

    expect(updated!.name).toBe('Renamed via patch');
    expect(updated!.userId).toBe('user_1');
    expect(updated!.createdAt).toBe('2026-07-01T00:00:00.000Z');
  });

  it('returns null when the client is owned by someone else', async () => {
    const result = await clientsService.update('user_2', 'client_1', { name: 'Hijacked' });
    expect(result).toBeNull();
  });

  it('returns null for a client that does not exist', async () => {
    const result = await clientsService.update('user_1', 'missing', { name: 'Ghost' });
    expect(result).toBeNull();
  });
});

describe('ClientsService.findAll', () => {
  beforeEach(() => {
    mockDb = createFakeFirestore({
      clients: [
        { id: 'client_1', userId: 'user_1', name: 'Kopi Kita', createdAt: '2026-07-01T00:00:00.000Z' },
        { id: 'client_2', userId: 'user_1', name: 'Warung Bahagia', createdAt: '2026-07-02T00:00:00.000Z' },
        { id: 'client_3', userId: 'user_2', name: 'Other User Co', createdAt: '2026-07-03T00:00:00.000Z' },
      ],
    }).db;
  });

  it('scopes results to the authenticated user', async () => {
    const page = await clientsService.findAll('user_1');
    expect(page.items.map((c) => c.id)).toEqual(['client_2', 'client_1']);
  });

  it('paginates results, keyed off the createdAt cursor', async () => {
    const first = await clientsService.findAll('user_1', undefined, { limit: 1 });
    expect(first.items.map((c) => c.id)).toEqual(['client_2']);
    expect(first.nextCursor).toBeTruthy();

    const second = await clientsService.findAll('user_1', undefined, {
      limit: 1,
      cursor: first.nextCursor!,
    });
    expect(second.items.map((c) => c.id)).toEqual(['client_1']);
    expect(second.nextCursor).toBeNull();
  });

  it('applies search before pagination', async () => {
    const page = await clientsService.findAll('user_1', 'kopi', { limit: 1 });
    expect(page.items.map((c) => c.id)).toEqual(['client_1']);
    expect(page.nextCursor).toBeNull();
  });
});
