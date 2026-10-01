let mockDb: ReturnType<typeof createFakeFirestore>['db'];

jest.mock('../firebase', () => ({
  get db() {
    return mockDb;
  },
}));

import { createFakeFirestore } from '../testing/fake-firestore';
import { settingsService } from './settings.service';

describe('SettingsService', () => {
  it('returns empty settings for a user who has never saved any (no migration)', async () => {
    mockDb = createFakeFirestore().db;
    expect(await settingsService.get('user_1')).toEqual({});
  });

  it('creates the settings doc on first save, keyed by the user id', async () => {
    mockDb = createFakeFirestore().db;

    const saved = await settingsService.update('user_1', { incomeType: 'professional' });
    expect(saved).toEqual({ incomeType: 'professional' });
    expect(await settingsService.get('user_1')).toEqual({ incomeType: 'professional' });
  });

  it('scopes settings to the user — one user cannot read another user’s answer', async () => {
    mockDb = createFakeFirestore({
      settings: [{ id: 'user_1', incomeType: 'business' }],
    }).db;

    expect(await settingsService.get('user_1')).toEqual({ incomeType: 'business' });
    expect(await settingsService.get('user_2')).toEqual({});
  });

  it('overwrites a prior answer rather than stacking, letting a user switch regimes', async () => {
    mockDb = createFakeFirestore({
      settings: [{ id: 'user_1', incomeType: 'business' }],
    }).db;

    const saved = await settingsService.update('user_1', { incomeType: 'professional' });
    expect(saved.incomeType).toBe('professional');
  });
});
