import { Test } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProjectsService.findOne totals', () => {
  let service: ProjectsService;
  const mockPrisma = {
    project: {
      findFirst: jest.fn().mockResolvedValue({
        id: 'proj_1',
        income: [{ amount: 2000 }, { amount: 2500 }],
        expenses: [{ amount: 320 }],
      }),
    },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ProjectsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get(ProjectsService);
  });

  it('computes income, expenses, and profit', async () => {
    const result = await service.findOne('user_1', 'proj_1');
    expect(result.totals).toEqual({ income: 4500, expenses: 320, profit: 4180 });
  });
});
