import { Injectable } from '@nestjs/common';
import { ProjectStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { calculateProfit } from '../common/calculate-profit';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  create(userId: string, dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        userId,
        name: dto.name,
        clientId: dto.clientId,
        status: dto.status as ProjectStatus | undefined,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      },
    });
  }

  findAll(userId: string, filters: { status?: string; clientId?: string; archived?: boolean }) {
    return this.prisma.project.findMany({
      where: {
        userId,
        archived: filters.archived ?? false,
        status: filters.status as ProjectStatus | undefined,
        clientId: filters.clientId,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, userId },
      include: { client: true, income: true, expenses: true },
    });
    if (!project) return null;

    return {
      ...project,
      totals: calculateProfit(project.income, project.expenses),
    };
  }

  update(userId: string, id: string, dto: Partial<CreateProjectDto>) {
    return this.prisma.project.update({
      where: { id, userId },
      data: {
        name: dto.name,
        clientId: dto.clientId,
        status: dto.status as ProjectStatus | undefined,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      },
    });
  }

  archive(userId: string, id: string) {
    return this.prisma.project.update({ where: { id, userId }, data: { archived: true } });
  }
}
