import { db } from '../firebase';
import { COLLECTIONS } from '../collections';
import type { IncomeType } from '../tax/calculate-pph-umkm';
import type { UpdateSettingsDto } from './dto/update-settings.dto';

/**
 * Per-user app settings. Unlike the other collections (many docs per user,
 * keyed by an auto id), this is a single document per user, keyed BY the
 * user's id — a user has exactly one settings record, and reading it is a
 * point lookup rather than a query.
 *
 * Every field is optional. A brand-new user, or any user from before this
 * feature shipped, simply has no settings doc; `get` returns `{}` for them, so
 * `incomeType` is `undefined` — the "not answered yet" state. No migration.
 */
export interface Settings {
  incomeType?: IncomeType;
}

class SettingsService {
  private get collection() {
    return db.collection(COLLECTIONS.settings);
  }

  async get(userId: string): Promise<Settings> {
    const doc = await this.collection.doc(userId).get();
    if (!doc.exists) return {};
    const data = doc.data() ?? {};
    return { incomeType: data.incomeType as IncomeType | undefined };
  }

  async update(userId: string, dto: UpdateSettingsDto): Promise<Settings> {
    const patch: Record<string, unknown> = {};
    if (dto.incomeType !== undefined) patch.incomeType = dto.incomeType;

    // merge: create the doc on first save, patch it thereafter — never
    // clobbering settings this PATCH didn't mention.
    await this.collection.doc(userId).set(patch, { merge: true });
    return this.get(userId);
  }
}

export const settingsService = new SettingsService();
