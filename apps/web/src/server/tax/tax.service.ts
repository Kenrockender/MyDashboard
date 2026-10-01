import { db } from '../firebase';
import { COLLECTIONS, docToEntity } from '../collections';
import { calculatePphUmkmEstimate, type PphUmkmEstimate } from './calculate-pph-umkm';
import { settingsService } from '../settings/settings.service';
import type { Income } from '../income/income.service';

class TaxService {
  async getPphUmkmEstimate(userId: string, year: number): Promise<PphUmkmEstimate | null> {
    const [snapshot, settings] = await Promise.all([
      db.collection(COLLECTIONS.income).where('userId', '==', userId).get(),
      settingsService.get(userId),
    ]);
    const income = snapshot.docs.map((d) => docToEntity<Income>(d));
    return calculatePphUmkmEstimate(income, year, settings.incomeType);
  }
}

export const taxService = new TaxService();
