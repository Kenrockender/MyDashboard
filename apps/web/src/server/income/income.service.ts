import { NotFoundException } from '@nestjs/common';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../firebase';
import { COLLECTIONS, docToEntity } from '../collections';
import { CreateIncomeDto } from './dto/create-income.dto';
import type { UpdateIncomeDto } from './dto/update-income.dto';
import { Currency } from '../common/currencies';

export interface Income {
  id: string;
  userId: string;
  projectId: string;
  amount: number;
  currency: Currency;
  description?: string;
  status: string;
  date: Date;
  createdAt: Date;
}

class IncomeService {
  private get collection() {
    return db.collection(COLLECTIONS.income);
  }

  private async assertProjectOwnership(userId: string, projectId: string) {
    const doc = await db
      .collection(COLLECTIONS.projects)
      .doc(projectId)
      .get();
    if (!doc.exists || doc.data()?.userId !== userId) {
      throw new NotFoundException('Project not found');
    }
  }

  async create(
    userId: string,
    projectId: string,
    dto: CreateIncomeDto,
  ): Promise<Income> {
    await this.assertProjectOwnership(userId, projectId);
    const ref = await this.collection.add({
      userId,
      projectId,
      amount: dto.amount,
      currency: dto.currency ?? 'USD',
      description: dto.description ?? null,
      status: dto.status ?? 'pending',
      date: Timestamp.fromDate(new Date(dto.date)),
      createdAt: Timestamp.now(),
    });
    return docToEntity<Income>(await ref.get());
  }

  async findAll(userId: string, projectId: string): Promise<Income[]> {
    await this.assertProjectOwnership(userId, projectId);
    const snapshot = await this.collection
      .where('projectId', '==', projectId)
      .orderBy('date', 'desc')
      .get();
    return snapshot.docs.map((doc) => docToEntity<Income>(doc));
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateIncomeDto,
  ): Promise<Income> {
    const ref = this.collection.doc(id);
    const doc = await ref.get();
    if (!doc.exists || doc.data()?.userId !== userId) {
      throw new NotFoundException('Income not found');
    }

    const patch: Record<string, unknown> = {};
    if (dto.amount !== undefined) patch.amount = dto.amount;
    if (dto.currency !== undefined) patch.currency = dto.currency;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.status !== undefined) patch.status = dto.status;
    if (dto.date !== undefined)
      patch.date = Timestamp.fromDate(new Date(dto.date));

    await ref.update(patch);
    return docToEntity<Income>(await ref.get());
  }

  async remove(userId: string, id: string): Promise<{ id: string }> {
    const ref = this.collection.doc(id);
    const doc = await ref.get();
    if (!doc.exists || doc.data()?.userId !== userId) {
      throw new NotFoundException('Income not found');
    }
    await ref.delete();
    return { id };
  }
}

export const incomeService = new IncomeService();
