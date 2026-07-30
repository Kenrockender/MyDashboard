import { db } from '../firebase';
import { COLLECTIONS, docToEntity } from '../collections';
import { calculatePphUmkmEstimate, type PphUmkmEstimate } from './calculate-pph-umkm';
import type { Income } from '../income/income.service';

class TaxService {
  async getPphUmkmEstimate(userId: string, year: number): Promise<PphUmkmEstimate> {
    const snapshot = await db
      .collection(COLLECTIONS.income)
      .where('userId', '==', userId)
      .get();
    const income = snapshot.docs.map((d) => docToEntity<Income>(d));
    return calculatePphUmkmEstimate(income, year);
  }
}

export const taxService = new TaxService();
