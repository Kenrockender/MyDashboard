import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AttachmentsService } from './attachments.service';
import { FirebaseService } from '../firebase/firebase.service';
import { createFakeFirestore } from '../firebase/fake-firestore';
import { MAX_ATTACHMENT_BYTES } from './dto/create-attachment.dto';

async function buildService(seed: Parameters<typeof createFakeFirestore>[0]) {
  const module = await Test.createTestingModule({
    providers: [
      AttachmentsService,
      { provide: FirebaseService, useValue: createFakeFirestore(seed) },
    ],
  }).compile();
  return module.get(AttachmentsService);
}

describe('AttachmentsService', () => {
  describe('create', () => {
    it('stores an attachment scoped to the expense and its project', async () => {
      const service = await buildService({
        expenses: [{ id: 'exp_1', userId: 'user_1', projectId: 'proj_1' }],
      });

      const attachment = await service.create('user_1', 'exp_1', {
        filename: 'receipt.png',
        mimeType: 'image/png',
        dataBase64: 'aGVsbG8=',
      });
      expect(attachment.expenseId).toBe('exp_1');
      expect(attachment.projectId).toBe('proj_1');
      expect(attachment.filename).toBe('receipt.png');
    });

    it('rejects a file over the size cap', async () => {
      const service = await buildService({
        expenses: [{ id: 'exp_1', userId: 'user_1', projectId: 'proj_1' }],
      });

      // Comfortably over MAX_ATTACHMENT_BYTES once decoded from base64 (~4/3 ratio).
      const oversized = 'A'.repeat(Math.ceil((MAX_ATTACHMENT_BYTES * 4) / 3) + 1000);

      await expect(
        service.create('user_1', 'exp_1', {
          filename: 'huge.png',
          mimeType: 'image/png',
          dataBase64: oversized,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an expense belonging to another user', async () => {
      const service = await buildService({
        expenses: [{ id: 'exp_1', userId: 'user_2', projectId: 'proj_1' }],
      });

      await expect(
        service.create('user_1', 'exp_1', {
          filename: 'receipt.png',
          mimeType: 'image/png',
          dataBase64: 'aGVsbG8=',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllForExpense / remove', () => {
    it('excludes another user from listing or removing an attachment', async () => {
      const service = await buildService({
        expenses: [{ id: 'exp_1', userId: 'user_2', projectId: 'proj_1' }],
        attachments: [
          { id: 'att_1', userId: 'user_2', expenseId: 'exp_1', projectId: 'proj_1' },
        ],
      });

      await expect(service.findAllForExpense('user_1', 'exp_1')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.remove('user_1', 'att_1')).rejects.toThrow(NotFoundException);
    });

    it('lists and removes an owned attachment', async () => {
      const service = await buildService({
        expenses: [{ id: 'exp_1', userId: 'user_1', projectId: 'proj_1' }],
        attachments: [
          { id: 'att_1', userId: 'user_1', expenseId: 'exp_1', projectId: 'proj_1' },
        ],
      });

      const list = await service.findAllForExpense('user_1', 'exp_1');
      expect(list).toHaveLength(1);
      await expect(service.remove('user_1', 'att_1')).resolves.toEqual({ id: 'att_1' });
    });
  });
});
