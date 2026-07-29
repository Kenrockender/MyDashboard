import { Test } from '@nestjs/testing';
import { AttachmentsController } from './attachments.controller';
import { AttachmentsService } from './attachments.service';

describe('AttachmentsController', () => {
  let controller: AttachmentsController;
  const mockService = {
    create: jest.fn().mockResolvedValue({ id: 'att_1', filename: 'receipt.png' }),
    findAllForExpense: jest.fn().mockResolvedValue([]),
    remove: jest.fn().mockResolvedValue({ id: 'att_1' }),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [AttachmentsController],
      providers: [{ provide: AttachmentsService, useValue: mockService }],
    }).compile();
    controller = module.get(AttachmentsController);
  });

  it('creates an attachment for an expense', async () => {
    const dto = { filename: 'receipt.png', mimeType: 'image/png', dataBase64: 'abc' };
    const result = await controller.create('exp_1', dto, { userId: 'user_1' });
    expect(result.data.filename).toBe('receipt.png');
    expect(mockService.create).toHaveBeenCalledWith('user_1', 'exp_1', dto);
  });

  it('lists attachments for an expense', async () => {
    await controller.findAll('exp_1', { userId: 'user_1' });
    expect(mockService.findAllForExpense).toHaveBeenCalledWith('user_1', 'exp_1');
  });

  it('deletes an attachment', async () => {
    await controller.remove('att_1', { userId: 'user_1' });
    expect(mockService.remove).toHaveBeenCalledWith('user_1', 'att_1');
  });
});
