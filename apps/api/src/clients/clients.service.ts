import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  create(userId: string, dto: CreateClientDto) {
    return this.prisma.client.create({ data: { ...dto, userId } });
  }

  findAll(userId: string, search?: string) {
    return this.prisma.client.findMany({
      where: { userId, ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(userId: string, id: string) {
    return this.prisma.client.findFirst({ where: { id, userId }, include: { projects: true } });
  }

  update(userId: string, id: string, dto: Partial<CreateClientDto>) {
    return this.prisma.client.update({ where: { id, userId }, data: dto });
  }
}
