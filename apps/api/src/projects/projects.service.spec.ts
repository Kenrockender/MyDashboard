import { Test } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { FirebaseService } from '../firebase/firebase.service';
import { createFakeFirestore } from '../firebase/fake-firestore';

describe('ProjectsService.findOne totals', () => {
  let service: ProjectsService;

  beforeEach(async () => {
    const firebase = createFakeFirestore({
      projects: [
        {
          id: 'proj_1',
          userId: 'user_1',
          name: 'Website redesign',
          clientId: null,
          archived: false,
          createdAt: '2026-07-01T00:00:00.000Z',
        },
        {
          id: 'proj_2',
          userId: 'user_1',
          name: 'Mobile app',
          clientId: 'client_1',
          archived: false,
          createdAt: '2026-07-02T00:00:00.000Z',
        },
      ],
      income: [
        { id: 'inc_1', projectId: 'proj_1', amount: 2000 },
        { id: 'inc_2', projectId: 'proj_1', amount: 2500 },
      ],
      expenses: [{ id: 'exp_1', projectId: 'proj_1', amount: 320 }],
    });

    const module = await Test.createTestingModule({
      providers: [ProjectsService, { provide: FirebaseService, useValue: firebase }],
    }).compile();
    service = module.get(ProjectsService);
  });

  it('computes income, expenses, and profit', async () => {
    const result = await service.findOne('user_1', 'proj_1');
    expect(result!.totals).toEqual({ income: 4500, expenses: 320, profit: 4180 });
  });

  it('returns null for a project owned by someone else', async () => {
    expect(await service.findOne('user_2', 'proj_1')).toBeNull();
  });

  it('searches project names within the authenticated user projects', async () => {
    const result = await service.findAll('user_1', { search: 'WEB' });

    expect(result.map((project) => project.id)).toEqual(['proj_1']);
  });
});
