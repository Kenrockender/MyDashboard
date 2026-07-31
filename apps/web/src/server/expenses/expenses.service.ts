import { NotFoundException } from '@nestjs/common';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../firebase';
import { COLLECTIONS, docToEntity } from '../collections';
import { CreateExpenseDto, type RecurrenceInterval } from './dto/create-expense.dto';
import type { UpdateExpenseDto } from './dto/update-expense.dto';
import { Currency } from '../common/currencies';

export interface Expense {
  id: string;
  userId: string;
  projectId: string;
  amount: number;
  currency: Currency;
  category: string;
  description?: string;
  date: Date;
  createdAt: Date;
  isRecurring?: boolean;
  recurrenceInterval?: RecurrenceInterval | null;
}

class ExpensesService {
  private get collection() {
    return db.collection(COLLECTIONS.expenses);
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
    dto: CreateExpenseDto,
  ): Promise<Expense> {
    await this.assertProjectOwnership(userId, projectId);
    const isRecurring = dto.isRecurring ?? false;
    const ref = await this.collection.add({
      userId,
      projectId,
      amount: dto.amount,
      currency: dto.currency ?? 'USD',
      category: dto.category,
      description: dto.description ?? null,
      date: Timestamp.fromDate(new Date(dto.date)),
      createdAt: Timestamp.now(),
      isRecurring,
      recurrenceInterval: isRecurring ? (dto.recurrenceInterval ?? null) : null,
    });
    return docToEntity<Expense>(await ref.get());
  }

  async findAll(userId: string, projectId: string): Promise<Expense[]> {
    await this.assertProjectOwnership(userId, projectId);
    const snapshot = await this.collection
      .where('projectId', '==', projectId)
      .orderBy('date', 'desc')
      .get();
    return snapshot.docs.map((doc) => docToEntity<Expense>(doc));
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateExpenseDto,
  ): Promise<Expense> {
    const ref = this.collection.doc(id);
    const doc = await ref.get();
    if (!doc.exists || doc.data()?.userId !== userId) {
      throw new NotFoundException('Expense not found');
    }

    const patch: Record<string, unknown> = {};
    if (dto.amount !== undefined) patch.amount = dto.amount;
    if (dto.currency !== undefined) patch.currency = dto.currency;
    if (dto.category !== undefined) patch.category = dto.category;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.date !== undefined)
      patch.date = Timestamp.fromDate(new Date(dto.date));
    if (dto.isRecurring !== undefined) {
      patch.isRecurring = dto.isRecurring;
      // Turning recurrence off always clears the interval, regardless of
      // what else was sent — a non-recurring expense has no interval.
      if (!dto.isRecurring) patch.recurrenceInterval = null;
    }
    if (dto.recurrenceInterval !== undefined && dto.isRecurring !== false) {
      patch.recurrenceInterval = dto.recurrenceInterval;
    }

    await ref.update(patch);
    return docToEntity<Expense>(await ref.get());
  }

  async remove(userId: string, id: string): Promise<{ id: string }> {
    const ref = this.collection.doc(id);
    const doc = await ref.get();
    if (!doc.exists || doc.data()?.userId !== userId) {
      throw new NotFoundException('Expense not found');
    }
    await ref.delete();
    return { id };
  }
}

export const expensesService = new ExpensesService();
