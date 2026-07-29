import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { FirebaseService } from '../firebase/firebase.service';
import { createFakeFirestore } from '../firebase/fake-firestore';

async function buildService(seed: Parameters<typeof createFakeFirestore>[0]) {
  const module = await Test.createTestingModule({
    providers: [
      InvoicesService,
      { provide: FirebaseService, useValue: createFakeFirestore(seed) },
    ],
  }).compile();
  return module.get(InvoicesService);
}

describe('InvoicesService', () => {
  describe('create', () => {
    it('creates an invoice snapshotting the covered income', async () => {
      const service = await buildService({
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
      });

      const invoice = await service.create('user_1', 'proj_1', {
        incomeIds: ['inc_1', 'inc_2'],
      });
      expect(invoice.subtotal).toBe(1500);
      expect(invoice.currency).toBe('USD');
      expect(invoice.clientId).toBe('client_1');
      expect(invoice.status).toBe('draft');
      expect(invoice.invoiceNumber).toMatch(/^INV-\d{4}-0001$/);
    });

    it('rejects mixed-currency income selections', async () => {
      const service = await buildService({
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
      });

      await expect(
        service.create('user_1', 'proj_1', {
          incomeIds: ['inc_1', 'inc_2'],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects income belonging to another user', async () => {
      const service = await buildService({
        projects: [{ id: 'proj_1', userId: 'user_1' }],
        income: [
          {
            id: 'inc_1',
            userId: 'user_2',
            projectId: 'proj_1',
            amount: 1000,
          },
        ],
      });

      await expect(
        service.create('user_1', 'proj_1', { incomeIds: ['inc_1'] }),
      ).rejects.toThrow(NotFoundException);
    });

    it('numbers invoices sequentially per user', async () => {
      const service = await buildService({
        projects: [{ id: 'proj_1', userId: 'user_1' }],
        income: [
          { id: 'inc_1', userId: 'user_1', projectId: 'proj_1', amount: 100 },
          { id: 'inc_2', userId: 'user_1', projectId: 'proj_1', amount: 200 },
        ],
      });

      const first = await service.create('user_1', 'proj_1', {
        incomeIds: ['inc_1'],
      });
      const second = await service.create('user_1', 'proj_1', {
        incomeIds: ['inc_2'],
      });
      expect(first.invoiceNumber).not.toBe(second.invoiceNumber);
    });
  });

  describe('update', () => {
    it('only ever patches status/dueDate/notes, stamping paidAt when marked paid', async () => {
      const service = await buildService({
        invoices: [
          {
            id: 'inv_1',
            userId: 'user_1',
            status: 'sent',
            incomeIds: ['inc_1'],
            subtotal: 1000,
          },
        ],
      });

      const updated = await service.update('user_1', 'inv_1', {
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
      const service = await buildService({
        invoices: [{ id: 'inv_1', userId: 'user_1', status: 'draft' }],
      });

      const sent = await service.send('user_1', 'inv_1');
      expect(sent.status).toBe('sent');
      expect(sent.sentAt).toBeTruthy();
    });
  });

  describe('remove', () => {
    it('blocks deleting a non-draft invoice', async () => {
      const service = await buildService({
        invoices: [{ id: 'inv_1', userId: 'user_1', status: 'sent' }],
      });

      await expect(service.remove('user_1', 'inv_1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('allows deleting a draft invoice', async () => {
      const service = await buildService({
        invoices: [{ id: 'inv_1', userId: 'user_1', status: 'draft' }],
      });

      await expect(service.remove('user_1', 'inv_1')).resolves.toEqual({
        id: 'inv_1',
      });
    });
  });

  describe('scoping', () => {
    it('excludes another user from finding/updating/removing an invoice', async () => {
      const service = await buildService({
        invoices: [{ id: 'inv_1', userId: 'user_2', status: 'draft' }],
      });

      await expect(service.findOne('user_1', 'inv_1')).rejects.toThrow(
        NotFoundException,
      );
      await expect(
        service.update('user_1', 'inv_1', { notes: 'x' }),
      ).rejects.toThrow(NotFoundException);
      await expect(service.remove('user_1', 'inv_1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
