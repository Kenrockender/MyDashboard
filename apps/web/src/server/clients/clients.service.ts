import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../firebase';
import { COLLECTIONS, docToEntity } from '../collections';
import { CreateClientDto } from './dto/create-client.dto';
import type { UpdateClientDto } from './dto/update-client.dto';
import { paginate, type Page } from '../common/paginate';

export interface Client {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  createdAt: Date;
}

class ClientsService {
  private get collection() {
    return db.collection(COLLECTIONS.clients);
  }

  async create(userId: string, dto: CreateClientDto): Promise<Client> {
    const ref = await this.collection.add({
      ...dto,
      userId,
      createdAt: Timestamp.now(),
    });
    return docToEntity<Client>(await ref.get());
  }

  async findAll(
    userId: string,
    search?: string,
    pagination: { cursor?: string; limit?: number } = {},
  ): Promise<Page<Client>> {
    const snapshot = await this.collection
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    let clients = snapshot.docs.map((doc) => docToEntity<Client>(doc));

    // Firestore has no case-insensitive substring operator, so the search
    // filter that used to be a SQL `contains` runs in memory.
    if (search) {
      const needle = search.toLowerCase();
      clients = clients.filter((c) => c.name.toLowerCase().includes(needle));
    }

    return paginate(clients, pagination);
  }

  async findOne(userId: string, id: string) {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;

    const client = docToEntity<Client>(doc);
    if (client.userId !== userId) return null;

    const projects = await db
      .collection(COLLECTIONS.projects)
      .where('userId', '==', userId)
      .where('clientId', '==', id)
      .get();

    return { ...client, projects: projects.docs.map((d) => docToEntity(d)) };
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateClientDto,
  ): Promise<Client | null> {
    const ref = this.collection.doc(id);
    const doc = await ref.get();
    if (!doc.exists || docToEntity<Client>(doc).userId !== userId) return null;

    const patch: Record<string, unknown> = {};
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.email !== undefined) patch.email = dto.email;
    if (dto.phone !== undefined) patch.phone = dto.phone;
    if (dto.company !== undefined) patch.company = dto.company;

    await ref.update(patch);
    return docToEntity<Client>(await ref.get());
  }
}

export const clientsService = new ClientsService();
