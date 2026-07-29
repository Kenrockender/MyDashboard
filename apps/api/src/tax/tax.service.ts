import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { COLLECTIONS, docToEntity } from '../firebase/collections';
import { calculatePphUmkmEstimate, type PphUmkmEstimate } from './calculate-pph-umkm';
import type { Income } from '../income/income.service';

@Injectable()
export class TaxService {
  constructor(private firebase: FirebaseService) {}

  async getPphUmkmEstimate(userId: string, year: number): Promise<PphUmkmEstimate> {
    const snapshot = await this.firebase.db
      .collection(COLLECTIONS.income)
      .where('userId', '==', userId)
      .get();
    const income = snapshot.docs.map((d) => docToEntity<Income>(d));
    return calculatePphUmkmEstimate(income, year);
  }
}
