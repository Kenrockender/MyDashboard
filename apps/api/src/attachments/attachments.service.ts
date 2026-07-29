import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Timestamp } from 'firebase-admin/firestore';
import { FirebaseService } from '../firebase/firebase.service';
import { COLLECTIONS, docToEntity } from '../firebase/collections';
import { CreateAttachmentDto, MAX_ATTACHMENT_BYTES } from './dto/create-attachment.dto';

export interface Attachment {
  id: string;
  userId: string;
  expenseId: string;
  projectId: string;
  filename: string;
  mimeType: string;
  dataBase64: string;
  sizeBytes: number;
  createdAt: Date;
}

@Injectable()
export class AttachmentsService {
  constructor(private firebase: FirebaseService) {}

  private get collection() {
    return this.firebase.db.collection(COLLECTIONS.attachments);
  }

  /** Attachments are scoped to an expense, which is itself scoped to a
   *  project — this returns the expense's projectId so it can be
   *  denormalized onto the attachment, same reasoning as Invoice.clientId. */
  private async assertExpenseOwnership(
    userId: string,
    expenseId: string,
  ): Promise<{ projectId: string }> {
    const doc = await this.firebase.db
      .collection(COLLECTIONS.expenses)
      .doc(expenseId)
      .get();
    if (!doc.exists || doc.data()?.userId !== userId) {
      throw new NotFoundException('Expense not found');
    }
    return { projectId: doc.data()?.projectId };
  }

  async create(
    userId: string,
    expenseId: string,
    dto: CreateAttachmentDto,
  ): Promise<Attachment> {
    const { projectId } = await this.assertExpenseOwnership(userId, expenseId);

    // atob/Buffer overhead means the encoded string is what actually counts
    // against Firestore's 1MB document cap — approximate the raw size from
    // it directly rather than re-decoding just to measure.
    const sizeBytes = Math.floor((dto.dataBase64.length * 3) / 4);
    if (sizeBytes > MAX_ATTACHMENT_BYTES) {
      throw new BadRequestException(
        `File too large (${(sizeBytes / 1024).toFixed(0)}KB) — attachments are limited to ${MAX_ATTACHMENT_BYTES / 1024}KB since they're stored directly in Firestore.`,
      );
    }

    const ref = await this.collection.add({
      userId,
      expenseId,
      projectId,
      filename: dto.filename,
      mimeType: dto.mimeType,
      dataBase64: dto.dataBase64,
      sizeBytes,
      createdAt: Timestamp.now(),
    });
    return docToEntity<Attachment>(await ref.get());
  }

  async findAllForExpense(userId: string, expenseId: string): Promise<Attachment[]> {
    await this.assertExpenseOwnership(userId, expenseId);
    const snapshot = await this.collection
      .where('expenseId', '==', expenseId)
      .orderBy('createdAt', 'desc')
      .get();
    return snapshot.docs.map((doc) => docToEntity<Attachment>(doc));
  }

  async remove(userId: string, id: string): Promise<{ id: string }> {
    const ref = this.collection.doc(id);
    const doc = await ref.get();
    if (!doc.exists || doc.data()?.userId !== userId) {
      throw new NotFoundException('Attachment not found');
    }
    await ref.delete();
    return { id };
  }
}
