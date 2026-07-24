import { Test } from '@nestjs/testing';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';

describe('ExpensesController', () => {
  let controller: ExpensesController;
  const mockService = {
    create: jest.fn().mockResolvedValue({ id: 'exp_1', amount: 20 }),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ExpensesController],
      providers: [{ provide: ExpensesService, useValue: mockService }],
    }).compile();
    controller = module.get(ExpensesController);
  });

  it('creates an expense record', async () => {
    const dto = { amount: 20, category: 'domain', date: '2026-06-02' };
    const result = await controller.create('proj_1', dto, {
      userId: 'user_1',
    });
    expect(result.data.amount).toBe(20);
    expect(mockService.create).toHaveBeenCalledWith('user_1', 'proj_1', dto);
  });
});
