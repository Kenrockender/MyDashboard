let mockDb: ReturnType<typeof createFakeFirestore>['db'];

jest.mock('../firebase', () => ({
  get db() {
    return mockDb;
  },
}));

import { createFakeFirestore } from '../testing/fake-firestore';
import { taxService } from './tax.service';

describe('TaxService', () => {
  beforeEach(() => {
    mockDb = createFakeFirestore({
      income: [
        {
          id: 'i1',
          userId: 'user_1',
          amount: 600_000_000,
          currency: 'IDR',
          status: 'paid',
          date: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'i2',
          userId: 'user_2',
          amount: 999_000_000,
          currency: 'IDR',
          status: 'paid',
          date: '2026-01-01T00:00:00.000Z',
        },
      ],
    }).db;
  });

  it('scopes the PPh UMKM estimate to the requesting user only', async () => {
    const result = await taxService.getPphUmkmEstimate('user_1', 2026);
    expect(result.grossRevenueIdr).toBe(600_000_000);
  });
});
