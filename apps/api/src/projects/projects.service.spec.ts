import { Test } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { FirebaseService } from '../firebase/firebase.service';
import { createFakeFirestore } from '../firebase/fake-firestore';

describe('ProjectsService.findOne totals', () => {
  let service: ProjectsService;

  beforeEach(async () => {
    const firebase = createFakeFirestore({
      projects: [{ id: 'proj_1', userId: 'user_1', name: 'Site', clientId: null }],
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
});
