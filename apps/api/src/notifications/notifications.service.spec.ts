import { Test } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { FirebaseService } from '../firebase/firebase.service';
import { createFakeFirestore } from '../firebase/fake-firestore';

async function buildService(seed: Parameters<typeof createFakeFirestore>[0]) {
  const module = await Test.createTestingModule({
    providers: [
      NotificationsService,
      { provide: FirebaseService, useValue: createFakeFirestore(seed) },
    ],
  }).compile();
  return module.get(NotificationsService);
}

describe('NotificationsService', () => {
  it('joins project names onto overdue income and excludes other users', async () => {
    const service = await buildService({
      projects: [{ id: 'proj_1', userId: 'user_1', name: 'Website Redesign' }],
      income: [
        {
          id: 'i1',
          userId: 'user_1',
          projectId: 'proj_1',
          amount: 500,
          currency: 'USD',
          status: 'overdue',
          date: '2026-06-01T00:00:00.000Z',
        },
        {
          id: 'i2',
          userId: 'user_2',
          projectId: 'proj_1',
          amount: 999,
          currency: 'USD',
          status: 'overdue',
          date: '2026-06-01T00:00:00.000Z',
        },
      ],
    });

    const result = await service.getOverdueIncome('user_1');
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].projectName).toBe('Website Redesign');
    expect(result.totalsByCurrency).toEqual([{ currency: 'USD', total: 500 }]);
  });

  it('returns no entries when there is nothing overdue', async () => {
    const service = await buildService({
      projects: [{ id: 'proj_1', userId: 'user_1', name: 'Website Redesign' }],
      income: [
        {
          id: 'i1',
          userId: 'user_1',
          projectId: 'proj_1',
          amount: 500,
          currency: 'USD',
          status: 'paid',
          date: '2026-06-01T00:00:00.000Z',
        },
      ],
    });

    const result = await service.getOverdueIncome('user_1');
    expect(result.entries).toEqual([]);
    expect(result.totalsByCurrency).toEqual([]);
  });
});
