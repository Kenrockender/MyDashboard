let mockDb: ReturnType<typeof createFakeFirestore>['db'];

jest.mock('../firebase', () => ({
  get db() {
    return mockDb;
  },
}));

import { NotFoundException, BadRequestException } from '@nestjs/common';
import { createFakeFirestore } from '../testing/fake-firestore';
import { timeEntriesService } from './time-entries.service';

describe('TimeEntriesService', () => {
  describe('create', () => {
    it('creates an unlogged time entry scoped to the project', async () => {
      mockDb = createFakeFirestore({
        projects: [{ id: 'proj_1', userId: 'user_1' }],
      }).db;

      const entry = await timeEntriesService.create('user_1', 'proj_1', {
        hours: 3,
        date: '2026-06-01',
        hourlyRate: 50,
        currency: 'USD',
      });
      expect(entry.status).toBe('unlogged');
      expect(entry.incomeId).toBeNull();
      expect(entry.hours).toBe(3);
    });

    it('rejects a project belonging to another user', async () => {
      mockDb = createFakeFirestore({
        projects: [{ id: 'proj_1', userId: 'user_2' }],
      }).db;

      await expect(
        timeEntriesService.create('user_1', 'proj_1', { hours: 1, date: '2026-06-01' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update / remove', () => {
    it('blocks editing a time entry already logged as income', async () => {
      mockDb = createFakeFirestore({
        timeEntries: [
          { id: 'te_1', userId: 'user_1', projectId: 'proj_1', status: 'logged', hours: 2 },
        ],
      }).db;

      await expect(
        timeEntriesService.update('user_1', 'te_1', { hours: 5 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('blocks deleting a time entry already logged as income', async () => {
      mockDb = createFakeFirestore({
        timeEntries: [
          { id: 'te_1', userId: 'user_1', projectId: 'proj_1', status: 'logged', hours: 2 },
        ],
      }).db;

      await expect(timeEntriesService.remove('user_1', 'te_1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('allows editing/deleting an unlogged entry', async () => {
      mockDb = createFakeFirestore({
        timeEntries: [
          { id: 'te_1', userId: 'user_1', projectId: 'proj_1', status: 'unlogged', hours: 2 },
        ],
      }).db;

      const updated = await timeEntriesService.update('user_1', 'te_1', { hours: 5 });
      expect(updated.hours).toBe(5);
      await expect(timeEntriesService.remove('user_1', 'te_1')).resolves.toEqual({
        id: 'te_1',
      });
    });
  });

  describe('logAsIncome', () => {
    it('creates an Income record for hours * hourlyRate and marks the entry logged', async () => {
      mockDb = createFakeFirestore({
        timeEntries: [
          {
            id: 'te_1',
            userId: 'user_1',
            projectId: 'proj_1',
            status: 'unlogged',
            hours: 4,
            hourlyRate: 50,
            currency: 'USD',
            description: 'Design work',
            date: '2026-06-01T00:00:00.000Z',
          },
        ],
      }).db;

      const updated = await timeEntriesService.logAsIncome('user_1', 'te_1');
      expect(updated.status).toBe('logged');
      expect(updated.incomeId).toBeTruthy();
    });

    it('rejects logging an entry with no hourly rate set', async () => {
      mockDb = createFakeFirestore({
        timeEntries: [
          {
            id: 'te_1',
            userId: 'user_1',
            projectId: 'proj_1',
            status: 'unlogged',
            hours: 4,
            currency: 'USD',
            date: '2026-06-01T00:00:00.000Z',
          },
        ],
      }).db;

      await expect(timeEntriesService.logAsIncome('user_1', 'te_1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects logging an entry that is already logged', async () => {
      mockDb = createFakeFirestore({
        timeEntries: [
          {
            id: 'te_1',
            userId: 'user_1',
            projectId: 'proj_1',
            status: 'logged',
            hours: 4,
            hourlyRate: 50,
            currency: 'USD',
            date: '2026-06-01T00:00:00.000Z',
          },
        ],
      }).db;

      await expect(timeEntriesService.logAsIncome('user_1', 'te_1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('scoping', () => {
    it('excludes another user from finding/updating/removing a time entry', async () => {
      mockDb = createFakeFirestore({
        timeEntries: [
          { id: 'te_1', userId: 'user_2', projectId: 'proj_1', status: 'unlogged', hours: 1 },
        ],
      }).db;

      await expect(
        timeEntriesService.update('user_1', 'te_1', { hours: 2 }),
      ).rejects.toThrow(NotFoundException);
      await expect(timeEntriesService.remove('user_1', 'te_1')).rejects.toThrow(
        NotFoundException,
      );
      await expect(timeEntriesService.logAsIncome('user_1', 'te_1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
