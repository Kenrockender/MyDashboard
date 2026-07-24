import { Injectable } from '@nestjs/common';
import { Timestamp } from 'firebase-admin/firestore';
import { FirebaseService } from '../firebase/firebase.service';
import { COLLECTIONS, docToEntity } from '../firebase/collections';
import { calculateProfit } from '../common/calculate-profit';
import { CreateProjectDto } from './dto/create-project.dto';
import type { Client } from '../clients/clients.service';

export interface Project {
  id: string;
  userId: string;
  clientId?: string | null;
  name: string;
  status: string;
  startDate?: Date | null;
  endDate?: Date | null;
  archived: boolean;
  createdAt: Date;
}

@Injectable()
export class ProjectsService {
  constructor(private firebase: FirebaseService) {}

  private get collection() {
    return this.firebase.db.collection(COLLECTIONS.projects);
  }

  async create(userId: string, dto: CreateProjectDto): Promise<Project> {
    const ref = await this.collection.add({
      userId,
      name: dto.name,
      clientId: dto.clientId ?? null,
      status: dto.status ?? 'active',
      startDate: dto.startDate ? Timestamp.fromDate(new Date(dto.startDate)) : null,
      archived: false,
      createdAt: Timestamp.now(),
    });
    return docToEntity<Project>(await ref.get());
  }

  async findAll(
    userId: string,
    filters: {
      status?: string;
      clientId?: string;
      archived?: boolean;
      search?: string;
    },
  ): Promise<Project[]> {
    let query = this.collection
      .where('userId', '==', userId)
      .where('archived', '==', filters.archived ?? false);

    if (filters.status) query = query.where('status', '==', filters.status);
    if (filters.clientId) query = query.where('clientId', '==', filters.clientId);

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    const projects = snapshot.docs.map((doc) => docToEntity<Project>(doc));

    // Firestore does not offer case-insensitive substring matching. Filtering
    // the already user-scoped result keeps project search predictable.
    if (!filters.search) return projects;
    const needle = filters.search.toLowerCase();
    return projects.filter((project) => project.name.toLowerCase().includes(needle));
  }

  async findOne(userId: string, id: string) {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;

    const project = docToEntity<Project>(doc);
    if (project.userId !== userId) return null;

    const [incomeSnap, expenseSnap, clientDoc] = await Promise.all([
      this.firebase.db.collection(COLLECTIONS.income).where('projectId', '==', id).get(),
      this.firebase.db.collection(COLLECTIONS.expenses).where('projectId', '==', id).get(),
      project.clientId
        ? this.firebase.db.collection(COLLECTIONS.clients).doc(project.clientId).get()
        : Promise.resolve(null),
    ]);

    const income = incomeSnap.docs.map((d) => docToEntity<{ amount: number }>(d));
    const expenses = expenseSnap.docs.map((d) => docToEntity<{ amount: number }>(d));

    return {
      ...project,
      client: clientDoc?.exists ? docToEntity<Client>(clientDoc) : null,
      income,
      expenses,
      totals: calculateProfit(income, expenses),
    };
  }

  async update(
    userId: string,
    id: string,
    dto: Partial<CreateProjectDto>,
  ): Promise<Project | null> {
    const ref = this.collection.doc(id);
    const doc = await ref.get();
    if (!doc.exists || docToEntity<Project>(doc).userId !== userId) return null;

    const patch: Record<string, unknown> = {};
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.clientId !== undefined) patch.clientId = dto.clientId;
    if (dto.status !== undefined) patch.status = dto.status;
    if (dto.startDate !== undefined) {
      patch.startDate = dto.startDate ? Timestamp.fromDate(new Date(dto.startDate)) : null;
    }

    await ref.update(patch);
    return docToEntity<Project>(await ref.get());
  }

  async archive(userId: string, id: string): Promise<Project | null> {
    const ref = this.collection.doc(id);
    const doc = await ref.get();
    if (!doc.exists || docToEntity<Project>(doc).userId !== userId) return null;

    await ref.update({ archived: true });
    return docToEntity<Project>(await ref.get());
  }
}
