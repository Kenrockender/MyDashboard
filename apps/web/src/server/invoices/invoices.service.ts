import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../firebase';
import { COLLECTIONS, docToEntity } from '../collections';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { Currency } from '../common/currencies';
import type { Income } from '../income/income.service';
import type { Project } from '../projects/projects.service';
import type { Client } from '../clients/clients.service';
import { paginate, type Page } from '../common/paginate';

export interface Invoice {
  id: string;
  userId: string;
  projectId: string;
  clientId: string | null;
  invoiceNumber: string;
  incomeIds: string[];
  currency: Currency;
  subtotal: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  issueDate: Date;
  dueDate: Date | null;
  notes: string | null;
  sentAt: Date | null;
  paidAt: Date | null;
  createdAt: Date;
}

class InvoicesService {
  private get collection() {
    return db.collection(COLLECTIONS.invoices);
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

  /**
   * Sequential per user (`INV-{year}-{0001}`). Theoretical race condition
   * under concurrent creation — acceptable for a single-user app; no
   * Firestore transactions are used anywhere else in this codebase either.
   */
  private async nextInvoiceNumber(userId: string): Promise<string> {
    const snap = await this.collection.where('userId', '==', userId).get();
    const seq = snap.docs.length + 1;
    return `INV-${new Date().getFullYear()}-${String(seq).padStart(4, '0')}`;
  }

  async create(
    userId: string,
    projectId: string,
    dto: CreateInvoiceDto,
  ): Promise<Invoice> {
    const projectDoc = await db
      .collection(COLLECTIONS.projects)
      .doc(projectId)
      .get();
    if (!projectDoc.exists || projectDoc.data()?.userId !== userId) {
      throw new NotFoundException('Project not found');
    }
    const project = docToEntity<{ clientId?: string | null }>(projectDoc);

    const incomeDocs = await Promise.all(
      dto.incomeIds.map((id) =>
        db.collection(COLLECTIONS.income).doc(id).get(),
      ),
    );
    const incomeRecords: Income[] = incomeDocs.map((doc, idx) => {
      if (
        !doc.exists ||
        doc.data()?.userId !== userId ||
        doc.data()?.projectId !== projectId
      ) {
        throw new NotFoundException(
          `Income record not found: ${dto.incomeIds[idx]}`,
        );
      }
      return docToEntity<Income>(doc);
    });

    // An invoice is a formatted view over Income records, never a parallel
    // total — and this codebase never converts between currencies (see
    // calculateProfit), so an invoice can't mix them either.
    const currencies = new Set(
      incomeRecords.map((i) => i.currency ?? ('USD' as Currency)),
    );
    if (currencies.size > 1) {
      throw new BadRequestException(
        "Cannot combine multiple currencies on one invoice — Ledger doesn't convert between currencies.",
      );
    }
    const [currency] = currencies;
    const subtotal = incomeRecords.reduce(
      (sum, i) => sum + Number(i.amount),
      0,
    );
    const invoiceNumber = await this.nextInvoiceNumber(userId);

    const ref = await this.collection.add({
      userId,
      projectId,
      clientId: project.clientId ?? null,
      invoiceNumber,
      incomeIds: dto.incomeIds,
      currency,
      // Snapshotted at creation: later edits/deletes of the underlying
      // Income records must never retroactively change a sent/paid invoice.
      subtotal,
      status: 'draft',
      issueDate: Timestamp.now(),
      dueDate: dto.dueDate ? Timestamp.fromDate(new Date(dto.dueDate)) : null,
      notes: dto.notes ?? null,
      sentAt: null,
      paidAt: null,
      createdAt: Timestamp.now(),
    });
    return docToEntity<Invoice>(await ref.get());
  }

  async findAllForProject(
    userId: string,
    projectId: string,
  ): Promise<Invoice[]> {
    await this.assertProjectOwnership(userId, projectId);
    const snapshot = await this.collection
      .where('projectId', '==', projectId)
      .orderBy('createdAt', 'desc')
      .get();
    return snapshot.docs.map((doc) => docToEntity<Invoice>(doc));
  }

  async findAllForUser(
    userId: string,
    filters: { status?: string; search?: string; matchingClientIds?: string[] } = {},
    pagination: { cursor?: string; limit?: number } = {},
  ): Promise<Page<Invoice>> {
    let query = this.collection.where('userId', '==', userId);
    if (filters.status) query = query.where('status', '==', filters.status);
    const snapshot = await query.orderBy('createdAt', 'desc').get();
    let invoices = snapshot.docs.map((doc) => docToEntity<Invoice>(doc));

    // No dedicated search endpoint (Firestore can't do substring matching),
    // so this scans the already user-scoped result in memory, matching on
    // invoice number or on a client id the caller already resolved by name.
    if (filters.search) {
      const needle = filters.search.toLowerCase();
      const clientIdSet = new Set(filters.matchingClientIds ?? []);
      invoices = invoices.filter(
        (invoice) =>
          invoice.invoiceNumber.toLowerCase().includes(needle) ||
          (invoice.clientId !== null && clientIdSet.has(invoice.clientId)),
      );
    }

    return paginate(invoices, pagination);
  }

  async findOne(userId: string, id: string): Promise<Invoice> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists || doc.data()?.userId !== userId) {
      throw new NotFoundException('Invoice not found');
    }
    return docToEntity<Invoice>(doc);
  }

  /** Joins in the project/client/income data the invoice detail view and the
   *  rendered PDF both need — the invoice document itself only stores ids and
   *  the money snapshot. */
  async getDetail(
    userId: string,
    id: string,
  ): Promise<{
    invoice: Invoice;
    project: Project;
    client: Client | null;
    incomeLines: Income[];
  }> {
    const invoice = await this.findOne(userId, id);

    const [projectDoc, incomeDocs] = await Promise.all([
      db.collection(COLLECTIONS.projects).doc(invoice.projectId).get(),
      Promise.all(
        invoice.incomeIds.map((incomeId) =>
          db.collection(COLLECTIONS.income).doc(incomeId).get(),
        ),
      ),
    ]);
    if (!projectDoc.exists) {
      throw new NotFoundException('Project not found');
    }
    const project = docToEntity<Project>(projectDoc);

    const clientDoc = invoice.clientId
      ? await db.collection(COLLECTIONS.clients).doc(invoice.clientId).get()
      : null;
    const client = clientDoc?.exists ? docToEntity<Client>(clientDoc) : null;

    const incomeLines = incomeDocs
      .filter((doc) => doc.exists)
      .map((doc) => docToEntity<Income>(doc));

    return { invoice, project, client, incomeLines };
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateInvoiceDto,
  ): Promise<Invoice> {
    const ref = this.collection.doc(id);
    const doc = await ref.get();
    if (!doc.exists || doc.data()?.userId !== userId) {
      throw new NotFoundException('Invoice not found');
    }

    // incomeIds/subtotal are deliberately absent from UpdateInvoiceDto — the
    // money on an invoice is immutable once created (see `create`'s snapshot
    // comment), so there is nothing here that could touch them.
    const patch: Record<string, unknown> = {};
    if (dto.status !== undefined) {
      patch.status = dto.status;
      if (dto.status === 'paid') patch.paidAt = Timestamp.now();
    }
    if (dto.dueDate !== undefined) {
      patch.dueDate = dto.dueDate
        ? Timestamp.fromDate(new Date(dto.dueDate))
        : null;
    }
    if (dto.notes !== undefined) patch.notes = dto.notes;

    await ref.update(patch);
    return docToEntity<Invoice>(await ref.get());
  }

  async send(userId: string, id: string): Promise<Invoice> {
    const ref = this.collection.doc(id);
    const doc = await ref.get();
    if (!doc.exists || doc.data()?.userId !== userId) {
      throw new NotFoundException('Invoice not found');
    }
    await ref.update({ status: 'sent', sentAt: Timestamp.now() });
    return docToEntity<Invoice>(await ref.get());
  }

  async remove(userId: string, id: string): Promise<{ id: string }> {
    const ref = this.collection.doc(id);
    const doc = await ref.get();
    if (!doc.exists || doc.data()?.userId !== userId) {
      throw new NotFoundException('Invoice not found');
    }
    if (doc.data()?.status !== 'draft') {
      throw new BadRequestException(
        'Only draft invoices can be deleted — a sent invoice should stay visible to the client.',
      );
    }
    await ref.delete();
    return { id };
  }
}

export const invoicesService = new InvoicesService();
