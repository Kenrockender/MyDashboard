import { Test } from '@nestjs/testing';
import { TaxService } from './tax.service';
import { FirebaseService } from '../firebase/firebase.service';
import { createFakeFirestore } from '../firebase/fake-firestore';

async function buildService(seed: Parameters<typeof createFakeFirestore>[0]) {
  const module = await Test.createTestingModule({
    providers: [
      TaxService,
      { provide: FirebaseService, useValue: createFakeFirestore(seed) },
    ],
  }).compile();
  return module.get(TaxService);
}

describe('TaxService', () => {
  it('scopes the PPh UMKM estimate to the requesting user only', async () => {
    const service = await buildService({
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
    });

    const result = await service.getPphUmkmEstimate('user_1', 2026);
    expect(result.grossRevenueIdr).toBe(600_000_000);
  });
});
