import { Injectable } from '@nestjs/common';
import { Timestamp } from 'firebase-admin/firestore';
import { FirebaseService } from '../firebase/firebase.service';
import { COLLECTIONS, docToEntity } from '../firebase/collections';
import { CreateClientDto } from './dto/create-client.dto';

export interface Client {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  createdAt: Date;
}

@Injectable()
export class ClientsService {
  constructor(private firebase: FirebaseService) {}

  private get collection() {
    return this.firebase.db.collection(COLLECTIONS.clients);
  }

  async create(userId: string, dto: CreateClientDto): Promise<Client> {
    const ref = await this.collection.add({
      ...dto,
      userId,
      createdAt: Timestamp.now(),
    });
    return docToEntity<Client>(await ref.get());
  }

  async findAll(userId: string, search?: string): Promise<Client[]> {
    const snapshot = await this.collection
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    const clients = snapshot.docs.map((doc) => docToEntity<Client>(doc));

    // Firestore has no case-insensitive substring operator, so the search
    // filter that used to be a SQL `contains` runs in memory.
    if (!search) return clients;
    const needle = search.toLowerCase();
    return clients.filter((c) => c.name.toLowerCase().includes(needle));
  }

  async findOne(userId: string, id: string) {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;

    const client = docToEntity<Client>(doc);
    if (client.userId !== userId) return null;

    const projects = await this.firebase.db
      .collection(COLLECTIONS.projects)
      .where('userId', '==', userId)
      .where('clientId', '==', id)
      .get();

    return { ...client, projects: projects.docs.map((d) => docToEntity(d)) };
  }

  async update(userId: string, id: string, dto: Partial<CreateClientDto>): Promise<Client | null> {
    const ref = this.collection.doc(id);
    const doc = await ref.get();
    if (!doc.exists || docToEntity<Client>(doc).userId !== userId) return null;

    await ref.update({ ...dto });
    return docToEntity<Client>(await ref.get());
  }
}
