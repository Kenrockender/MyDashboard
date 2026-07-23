import { Test } from '@nestjs/testing';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';

describe('ClientsController', () => {
  let controller: ClientsController;
  const mockService = {
    create: jest.fn().mockResolvedValue({ id: 'clnt_1', name: 'Acme Corp' }),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ClientsController],
      providers: [{ provide: ClientsService, useValue: mockService }],
    }).compile();
    controller = module.get(ClientsController);
  });

  it('creates a client', async () => {
    const result = await controller.create({ name: 'Acme Corp' }, { userId: 'user_1' });
    expect(result.data.name).toBe('Acme Corp');
    expect(mockService.create).toHaveBeenCalledWith('user_1', { name: 'Acme Corp' });
  });
});
