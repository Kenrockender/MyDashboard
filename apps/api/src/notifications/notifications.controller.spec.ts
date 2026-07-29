import { Test } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  const mockService = {
    getOverdueIncome: jest
      .fn()
      .mockResolvedValue({ entries: [], totalsByCurrency: [] }),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [{ provide: NotificationsService, useValue: mockService }],
    }).compile();
    controller = module.get(NotificationsController);
  });

  it('returns overdue income for the current user', async () => {
    const result = await controller.overdueIncome({ userId: 'user_1' });
    expect(result.data).toEqual({ entries: [], totalsByCurrency: [] });
    expect(mockService.getOverdueIncome).toHaveBeenCalledWith('user_1');
  });
});
