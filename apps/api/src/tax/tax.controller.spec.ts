import { Test } from '@nestjs/testing';
import { TaxController } from './tax.controller';
import { TaxService } from './tax.service';

describe('TaxController', () => {
  let controller: TaxController;
  const mockService = {
    getPphUmkmEstimate: jest.fn().mockResolvedValue({
      year: 2026,
      grossRevenueIdr: 600_000_000,
      exemptThresholdIdr: 500_000_000,
      taxableAmountIdr: 100_000_000,
      rate: 0.005,
      estimatedTaxIdr: 500_000,
    }),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [TaxController],
      providers: [{ provide: TaxService, useValue: mockService }],
    }).compile();
    controller = module.get(TaxController);
  });

  it('passes the requested year through to the service', async () => {
    const result = await controller.pphUmkm('2026', { userId: 'user_1' });
    expect(result.data.estimatedTaxIdr).toBe(500_000);
    expect(mockService.getPphUmkmEstimate).toHaveBeenCalledWith('user_1', 2026);
  });

  it('defaults to the current year when none is given', async () => {
    await controller.pphUmkm(undefined, { userId: 'user_1' });
    expect(mockService.getPphUmkmEstimate).toHaveBeenCalledWith(
      'user_1',
      new Date().getUTCFullYear(),
    );
  });
});
