// `attachmentsService` imports `db` as a module-level singleton (no DI to swap
// in a fake), so the fake Firestore is substituted by mocking the `../firebase`
// module itself. The mock returns a getter so each test's `beforeEach` can
// swap in a fresh fake store before the service reads `db` at call time.
let mockDb: ReturnType<typeof createFakeFirestore>['db'];

jest.mock('../firebase', () => ({
  get db() {
    return mockDb;
  },
}));

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { createFakeFirestore } from '../testing/fake-firestore';
import { attachmentsService } from './attachments.service';
import { MAX_ATTACHMENT_BYTES } from './dto/create-attachment.dto';

describe('AttachmentsService', () => {
  describe('create', () => {
    it('stores an attachment scoped to the expense and its project', async () => {
      mockDb = createFakeFirestore({
        expenses: [{ id: 'exp_1', userId: 'user_1', projectId: 'proj_1' }],
      }).db;

      const attachment = await attachmentsService.create('user_1', 'exp_1', {
        filename: 'receipt.png',
        mimeType: 'image/png',
        dataBase64: 'aGVsbG8=',
      });
      expect(attachment.expenseId).toBe('exp_1');
      expect(attachment.projectId).toBe('proj_1');
      expect(attachment.filename).toBe('receipt.png');
    });

    it('rejects a file over the size cap', async () => {
      mockDb = createFakeFirestore({
        expenses: [{ id: 'exp_1', userId: 'user_1', projectId: 'proj_1' }],
      }).db;

      // Comfortably over MAX_ATTACHMENT_BYTES once decoded from base64 (~4/3 ratio).
      const oversized = 'A'.repeat(Math.ceil((MAX_ATTACHMENT_BYTES * 4) / 3) + 1000);

      await expect(
        attachmentsService.create('user_1', 'exp_1', {
          filename: 'huge.png',
          mimeType: 'image/png',
          dataBase64: oversized,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an expense belonging to another user', async () => {
      mockDb = createFakeFirestore({
        expenses: [{ id: 'exp_1', userId: 'user_2', projectId: 'proj_1' }],
      }).db;

      await expect(
        attachmentsService.create('user_1', 'exp_1', {
          filename: 'receipt.png',
          mimeType: 'image/png',
          dataBase64: 'aGVsbG8=',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllForExpense / remove', () => {
    it('excludes another user from listing or removing an attachment', async () => {
      mockDb = createFakeFirestore({
        expenses: [{ id: 'exp_1', userId: 'user_2', projectId: 'proj_1' }],
        attachments: [
          { id: 'att_1', userId: 'user_2', expenseId: 'exp_1', projectId: 'proj_1' },
        ],
      }).db;

      await expect(
        attachmentsService.findAllForExpense('user_1', 'exp_1'),
      ).rejects.toThrow(NotFoundException);
      await expect(attachmentsService.remove('user_1', 'att_1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lists and removes an owned attachment', async () => {
      mockDb = createFakeFirestore({
        expenses: [{ id: 'exp_1', userId: 'user_1', projectId: 'proj_1' }],
        attachments: [
          { id: 'att_1', userId: 'user_1', expenseId: 'exp_1', projectId: 'proj_1' },
        ],
      }).db;

      const list = await attachmentsService.findAllForExpense('user_1', 'exp_1');
      expect(list).toHaveLength(1);
      await expect(attachmentsService.remove('user_1', 'att_1')).resolves.toEqual({
        id: 'att_1',
      });
    });
  });
});
