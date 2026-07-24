import { Test } from '@nestjs/testing';
import { IncomeController } from './income.controller';
import { IncomeService } from './income.service';

describe('IncomeController', () => {
  let controller: IncomeController;
  const mockService = {
    create: jest.fn().mockResolvedValue({ id: 'inc_1', amount: 2000 }),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [IncomeController],
      providers: [{ provide: IncomeService, useValue: mockService }],
    }).compile();
    controller = module.get(IncomeController);
  });

  it('creates an income record', async () => {
    const dto = { amount: 2000, date: '2026-06-01' };
    const result = await controller.create('proj_1', dto, {
      userId: 'user_1',
    });
    expect(result.data.amount).toBe(2000);
    expect(mockService.create).toHaveBeenCalledWith('user_1', 'proj_1', dto);
  });
});
