import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../firebase';
import { COLLECTIONS, docToEntity } from '../collections';
import { calculateProfit } from '../common/calculate-profit';
import { CreateProjectDto, DealType } from './dto/create-project.dto';
import type { UpdateProjectDto } from './dto/update-project.dto';
import { paginate, type Page } from '../common/paginate';
import { Currency } from '../common/currencies';
import type { Client } from '../clients/clients.service';

export interface Project {
  id: string;
  userId: string;
  clientId?: string | null;
  name: string;
  status: string;
  dealType: DealType;
  startDate?: Date | null;
  endDate?: Date | null;
  archived: boolean;
  createdAt: Date;
  budget?: number | null;
  budgetCurrency?: Currency | null;
}

class ProjectsService {
  private get collection() {
    return db.collection(COLLECTIONS.projects);
  }

  async create(userId: string, dto: CreateProjectDto): Promise<Project> {
    const dealType = dto.dealType ?? 'ongoing';
    const status =
      dealType === 'one_time' ? 'completed' : (dto.status ?? 'active');
    const startDate = dto.startDate
      ? Timestamp.fromDate(new Date(dto.startDate))
      : null;

    const ref = await this.collection.add({
      userId,
      name: dto.name,
      clientId: dto.clientId ?? null,
      status,
      dealType,
      startDate,
      archived: false,
      createdAt: Timestamp.now(),
      budget: dealType === 'one_time' ? null : (dto.budget ?? null),
      budgetCurrency: dealType === 'one_time' ? null : (dto.budgetCurrency ?? null),
    });

    if (dealType === 'one_time') {
      await this.recordOneTimeSale(userId, ref.id, dto, startDate);
    }

    return docToEntity<Project>(await ref.get());
  }

  /**
   * A one-time sale skips the ongoing income/expense workflow, but still
   * writes a single Income (and optional Expense) record so it flows through
   * the exact same totals/reports/dashboard math as an ongoing project.
   */
  private async recordOneTimeSale(
    userId: string,
    projectId: string,
    dto: CreateProjectDto,
    date: Timestamp | null,
  ) {
    const saleDate = date ?? Timestamp.now();
    const currency: Currency = dto.saleCurrency ?? 'USD';

    if (dto.saleAmount) {
      await db.collection(COLLECTIONS.income).add({
        userId,
        projectId,
        amount: dto.saleAmount,
        currency,
        description: 'Sale',
        status: 'paid',
        date: saleDate,
        createdAt: Timestamp.now(),
      });
    }

    if (dto.cost) {
      await db.collection(COLLECTIONS.expenses).add({
        userId,
        projectId,
        amount: dto.cost,
        currency,
        category: 'miscellaneous',
        description: 'Cost of sale',
        date: saleDate,
        createdAt: Timestamp.now(),
      });
    }
  }

  async findAll(
    userId: string,
    filters: {
      status?: string;
      clientId?: string;
      archived?: boolean;
      search?: string;
      dealType?: string;
    },
    pagination: { cursor?: string; limit?: number } = {},
  ): Promise<Page<Project>> {
    let query = this.collection
      .where('userId', '==', userId)
      .where('archived', '==', filters.archived ?? false);

    if (filters.status) query = query.where('status', '==', filters.status);
    if (filters.clientId)
      query = query.where('clientId', '==', filters.clientId);
    if (filters.dealType)
      query = query.where('dealType', '==', filters.dealType);

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    let projects = snapshot.docs.map((doc) => docToEntity<Project>(doc));

    // Firestore does not offer case-insensitive substring matching. Filtering
    // the already user-scoped result keeps project search predictable.
    if (filters.search) {
      const needle = filters.search.toLowerCase();
      projects = projects.filter((project) =>
        project.name.toLowerCase().includes(needle),
      );
    }

    return paginate(projects, pagination);
  }

  async findOne(userId: string, id: string) {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;

    const project = docToEntity<Project>(doc);
    if (project.userId !== userId) return null;

    const [incomeSnap, expenseSnap, clientDoc] = await Promise.all([
      db.collection(COLLECTIONS.income).where('projectId', '==', id).get(),
      db.collection(COLLECTIONS.expenses).where('projectId', '==', id).get(),
      project.clientId
        ? db.collection(COLLECTIONS.clients).doc(project.clientId).get()
        : Promise.resolve(null),
    ]);

    const income = incomeSnap.docs.map((d) =>
      docToEntity<{ amount: number; currency?: Currency }>(d),
    );
    const expenses = expenseSnap.docs.map((d) =>
      docToEntity<{ amount: number; currency?: Currency }>(d),
    );

    const rawTotals = calculateProfit(income, expenses);
    // A project with no income/expenses yet still gets one $0 row so the
    // totals card has something to show instead of rendering empty.
    const totals =
      rawTotals.length > 0
        ? rawTotals
        : [{ currency: 'USD' as const, income: 0, expenses: 0, profit: 0 }];

    return {
      ...project,
      client: clientDoc?.exists ? docToEntity<Client>(clientDoc) : null,
      income,
      expenses,
      totals,
    };
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateProjectDto,
  ): Promise<Project | null> {
    const ref = this.collection.doc(id);
    const doc = await ref.get();
    if (!doc.exists || docToEntity<Project>(doc).userId !== userId) return null;

    const patch: Record<string, unknown> = {};
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.clientId !== undefined) patch.clientId = dto.clientId;
    if (dto.status !== undefined) patch.status = dto.status;
    if (dto.startDate !== undefined) {
      patch.startDate = dto.startDate
        ? Timestamp.fromDate(new Date(dto.startDate))
        : null;
    }
    if (dto.budget !== undefined) patch.budget = dto.budget;
    if (dto.budgetCurrency !== undefined) patch.budgetCurrency = dto.budgetCurrency;

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

export const projectsService = new ProjectsService();
