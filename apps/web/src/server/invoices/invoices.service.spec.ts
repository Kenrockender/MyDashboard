// `invoicesService` imports `db` as a module-level singleton (no DI to swap
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
import { invoicesService } from './invoices.service';

describe('InvoicesService', () => {
  describe('create', () => {
    it('creates an invoice snapshotting the covered income', async () => {
      mockDb = createFakeFirestore({
        projects: [{ id: 'proj_1', userId: 'user_1', clientId: 'client_1' }],
        income: [
          {
            id: 'inc_1',
            userId: 'user_1',
            projectId: 'proj_1',
            amount: 1000,
            currency: 'USD',
          },
          {
            id: 'inc_2',
            userId: 'user_1',
            projectId: 'proj_1',
            amount: 500,
            currency: 'USD',
          },
        ],
      }).db;

      const invoice = await invoicesService.create('user_1', 'proj_1', {
        incomeIds: ['inc_1', 'inc_2'],
      });
      expect(invoice.subtotal).toBe(1500);
      expect(invoice.currency).toBe('USD');
      expect(invoice.clientId).toBe('client_1');
      expect(invoice.status).toBe('draft');
      expect(invoice.invoiceNumber).toMatch(/^INV-\d{4}-0001$/);
    });

    it('rejects mixed-currency income selections', async () => {
      mockDb = createFakeFirestore({
        projects: [{ id: 'proj_1', userId: 'user_1' }],
        income: [
          {
            id: 'inc_1',
            userId: 'user_1',
            projectId: 'proj_1',
            amount: 1000,
            currency: 'USD',
          },
          {
            id: 'inc_2',
            userId: 'user_1',
            projectId: 'proj_1',
            amount: 500,
            currency: 'IDR',
          },
        ],
      }).db;

      await expect(
        invoicesService.create('user_1', 'proj_1', {
          incomeIds: ['inc_1', 'inc_2'],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects income belonging to another user', async () => {
      mockDb = createFakeFirestore({
        projects: [{ id: 'proj_1', userId: 'user_1' }],
        income: [
          {
            id: 'inc_1',
            userId: 'user_2',
            projectId: 'proj_1',
            amount: 1000,
          },
        ],
      }).db;

      await expect(
        invoicesService.create('user_1', 'proj_1', { incomeIds: ['inc_1'] }),
      ).rejects.toThrow(NotFoundException);
    });

    it('numbers invoices sequentially per user', async () => {
      mockDb = createFakeFirestore({
        projects: [{ id: 'proj_1', userId: 'user_1' }],
        income: [
          { id: 'inc_1', userId: 'user_1', projectId: 'proj_1', amount: 100 },
          { id: 'inc_2', userId: 'user_1', projectId: 'proj_1', amount: 200 },
        ],
      }).db;

      const first = await invoicesService.create('user_1', 'proj_1', {
        incomeIds: ['inc_1'],
      });
      const second = await invoicesService.create('user_1', 'proj_1', {
        incomeIds: ['inc_2'],
      });
      expect(first.invoiceNumber).not.toBe(second.invoiceNumber);
    });
  });

  describe('update', () => {
    it('only ever patches status/dueDate/notes, stamping paidAt when marked paid', async () => {
      mockDb = createFakeFirestore({
        invoices: [
          {
            id: 'inv_1',
            userId: 'user_1',
            status: 'sent',
            incomeIds: ['inc_1'],
            subtotal: 1000,
          },
        ],
      }).db;

      const updated = await invoicesService.update('user_1', 'inv_1', {
        status: 'paid',
      });
      expect(updated.incomeIds).toEqual(['inc_1']);
      expect(updated.subtotal).toBe(1000);
      expect(updated.status).toBe('paid');
      expect(updated.paidAt).toBeTruthy();
    });
  });

  describe('send', () => {
    it('flips status to sent and stamps sentAt', async () => {
      mockDb = createFakeFirestore({
        invoices: [{ id: 'inv_1', userId: 'user_1', status: 'draft' }],
      }).db;

      const sent = await invoicesService.send('user_1', 'inv_1');
      expect(sent.status).toBe('sent');
      expect(sent.sentAt).toBeTruthy();
    });
  });

  describe('remove', () => {
    it('blocks deleting a non-draft invoice', async () => {
      mockDb = createFakeFirestore({
        invoices: [{ id: 'inv_1', userId: 'user_1', status: 'sent' }],
      }).db;

      await expect(invoicesService.remove('user_1', 'inv_1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('allows deleting a draft invoice', async () => {
      mockDb = createFakeFirestore({
        invoices: [{ id: 'inv_1', userId: 'user_1', status: 'draft' }],
      }).db;

      await expect(invoicesService.remove('user_1', 'inv_1')).resolves.toEqual({
        id: 'inv_1',
      });
    });
  });

  describe('scoping', () => {
    it('excludes another user from finding/updating/removing an invoice', async () => {
      mockDb = createFakeFirestore({
        invoices: [{ id: 'inv_1', userId: 'user_2', status: 'draft' }],
      }).db;

      await expect(invoicesService.findOne('user_1', 'inv_1')).rejects.toThrow(
        NotFoundException,
      );
      await expect(
        invoicesService.update('user_1', 'inv_1', { notes: 'x' }),
      ).rejects.toThrow(NotFoundException);
      await expect(invoicesService.remove('user_1', 'inv_1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
