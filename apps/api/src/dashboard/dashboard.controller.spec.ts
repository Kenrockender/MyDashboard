import { Test } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

describe('DashboardController', () => {
  let controller: DashboardController;
  const mockService = {
    getSummary: jest.fn().mockResolvedValue({
      totalRevenue: 4500,
      totalExpenses: 320,
      netProfit: 4180,
      activeProjects: 1,
      completedProjects: 0,
      monthlyTrend: [],
      recentActivity: [],
    }),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [{ provide: DashboardService, useValue: mockService }],
    }).compile();
    controller = module.get(DashboardController);
  });

  it('returns the dashboard summary for the current user', async () => {
    const result = await controller.getSummary({ userId: 'user_1' });
    expect(result.data.netProfit).toBe(4180);
    expect(mockService.getSummary).toHaveBeenCalledWith('user_1');
  });
});
