import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Timestamp } from 'firebase-admin/firestore';
import { FirebaseService } from '../firebase/firebase.service';
import { COLLECTIONS, docToEntity } from '../firebase/collections';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { Currency } from '../common/currencies';

export interface TimeEntry {
  id: string;
  userId: string;
  projectId: string;
  description?: string;
  hours: number;
  date: Date;
  hourlyRate?: number;
  currency: Currency;
  status: 'unlogged' | 'logged';
  incomeId?: string | null;
  createdAt: Date;
}

@Injectable()
export class TimeEntriesService {
  constructor(private firebase: FirebaseService) {}

  private get collection() {
    return this.firebase.db.collection(COLLECTIONS.timeEntries);
  }

  private async assertProjectOwnership(userId: string, projectId: string) {
    const doc = await this.firebase.db
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
    dto: CreateTimeEntryDto,
  ): Promise<TimeEntry> {
    await this.assertProjectOwnership(userId, projectId);
    const ref = await this.collection.add({
      userId,
      projectId,
      description: dto.description ?? null,
      hours: dto.hours,
      date: Timestamp.fromDate(new Date(dto.date)),
      hourlyRate: dto.hourlyRate ?? null,
      currency: dto.currency ?? 'USD',
      status: 'unlogged',
      incomeId: null,
      createdAt: Timestamp.now(),
    });
    return docToEntity<TimeEntry>(await ref.get());
  }

  async findAll(userId: string, projectId: string): Promise<TimeEntry[]> {
    await this.assertProjectOwnership(userId, projectId);
    const snapshot = await this.collection
      .where('projectId', '==', projectId)
      .orderBy('date', 'desc')
      .get();
    return snapshot.docs.map((doc) => docToEntity<TimeEntry>(doc));
  }

  async update(
    userId: string,
    id: string,
    dto: Partial<CreateTimeEntryDto>,
  ): Promise<TimeEntry> {
    const ref = this.collection.doc(id);
    const doc = await ref.get();
    if (!doc.exists || doc.data()?.userId !== userId) {
      throw new NotFoundException('Time entry not found');
    }
    if (doc.data()?.status === 'logged') {
      throw new BadRequestException(
        'This time entry has already been logged as income and can no longer be edited.',
      );
    }

    const patch: Record<string, unknown> = {};
    if (dto.hours !== undefined) patch.hours = dto.hours;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.date !== undefined)
      patch.date = Timestamp.fromDate(new Date(dto.date));
    if (dto.hourlyRate !== undefined) patch.hourlyRate = dto.hourlyRate;
    if (dto.currency !== undefined) patch.currency = dto.currency;

    await ref.update(patch);
    return docToEntity<TimeEntry>(await ref.get());
  }

  async remove(userId: string, id: string): Promise<{ id: string }> {
    const ref = this.collection.doc(id);
    const doc = await ref.get();
    if (!doc.exists || doc.data()?.userId !== userId) {
      throw new NotFoundException('Time entry not found');
    }
    if (doc.data()?.status === 'logged') {
      throw new BadRequestException(
        'This time entry has already been logged as income and can no longer be deleted.',
      );
    }
    await ref.delete();
    return { id };
  }

  /**
   * Converts hours * hourlyRate into a standalone Income record — mirrors
   * ProjectsService#recordOneTimeSale, which writes directly to the Income
   * collection rather than depending on IncomeService, so this stays
   * consistent with that existing cross-collection-write convention.
   */
  async logAsIncome(userId: string, id: string): Promise<TimeEntry> {
    const ref = this.collection.doc(id);
    const doc = await ref.get();
    if (!doc.exists || doc.data()?.userId !== userId) {
      throw new NotFoundException('Time entry not found');
    }
    const entry = docToEntity<TimeEntry>(doc);
    if (entry.status === 'logged') {
      throw new BadRequestException(
        'This time entry has already been logged as income.',
      );
    }
    if (!entry.hourlyRate) {
      throw new BadRequestException(
        'Set an hourly rate on this entry before logging it as income.',
      );
    }

    const incomeRef = await this.firebase.db.collection(COLLECTIONS.income).add({
      userId,
      projectId: entry.projectId,
      amount: entry.hours * entry.hourlyRate,
      currency: entry.currency,
      description: entry.description || `${entry.hours}h logged time`,
      status: 'pending',
      date: Timestamp.fromDate(new Date(entry.date)),
      createdAt: Timestamp.now(),
    });

    await ref.update({ status: 'logged', incomeId: incomeRef.id });
    return docToEntity<TimeEntry>(await ref.get());
  }
}
