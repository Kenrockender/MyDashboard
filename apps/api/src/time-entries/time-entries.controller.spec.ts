import { Test } from '@nestjs/testing';
import { TimeEntriesController } from './time-entries.controller';
import { TimeEntriesService } from './time-entries.service';

describe('TimeEntriesController', () => {
  let controller: TimeEntriesController;
  const mockService = {
    create: jest.fn().mockResolvedValue({ id: 'te_1', hours: 3 }),
    findAll: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue({ id: 'te_1', hours: 4 }),
    logAsIncome: jest
      .fn()
      .mockResolvedValue({ id: 'te_1', status: 'logged', incomeId: 'inc_1' }),
    remove: jest.fn().mockResolvedValue({ id: 'te_1' }),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [TimeEntriesController],
      providers: [{ provide: TimeEntriesService, useValue: mockService }],
    }).compile();
    controller = module.get(TimeEntriesController);
  });

  it('creates a time entry for a project', async () => {
    const dto = { hours: 3, date: '2026-06-01' };
    const result = await controller.create('proj_1', dto, {
      userId: 'user_1',
    });
    expect(result.data.hours).toBe(3);
    expect(mockService.create).toHaveBeenCalledWith('user_1', 'proj_1', dto);
  });

  it('lists time entries for a project', async () => {
    await controller.findAll('proj_1', { userId: 'user_1' });
    expect(mockService.findAll).toHaveBeenCalledWith('user_1', 'proj_1');
  });

  it('updates a time entry', async () => {
    const dto = { hours: 4 };
    const result = await controller.update('te_1', dto, { userId: 'user_1' });
    expect(result.data.hours).toBe(4);
    expect(mockService.update).toHaveBeenCalledWith('user_1', 'te_1', dto);
  });

  it('logs a time entry as income', async () => {
    const result = await controller.logAsIncome('te_1', { userId: 'user_1' });
    expect(result.data.status).toBe('logged');
    expect(mockService.logAsIncome).toHaveBeenCalledWith('user_1', 'te_1');
  });

  it('deletes a time entry', async () => {
    await controller.remove('te_1', { userId: 'user_1' });
    expect(mockService.remove).toHaveBeenCalledWith('user_1', 'te_1');
  });
});
