import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  create(userId: string, dto: CreateProjectDto) {
    return this.prisma.project.create({ data: { ...dto, userId } });
  }

  findAll(userId: string, filters: { status?: string; clientId?: string; archived?: boolean }) {
    return this.prisma.project.findMany({
      where: { userId, archived: filters.archived ?? false, ...filters },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, userId },
      include: { client: true, income: true, expenses: true },
    });
    if (!project) return null;

    const totalIncome = project.income.reduce((sum: number, i: { amount: number }) => sum + Number(i.amount), 0);
    const totalExpenses = project.expenses.reduce((sum: number, e: { amount: number }) => sum + Number(e.amount), 0);

    return {
      ...project,
      totals: { income: totalIncome, expenses: totalExpenses, profit: totalIncome - totalExpenses },
    };
  }

  update(userId: string, id: string, dto: Partial<CreateProjectDto>) {
    return this.prisma.project.update({ where: { id, userId }, data: dto });
  }

  archive(userId: string, id: string) {
    return this.prisma.project.update({ where: { id, userId }, data: { archived: true } });
  }
}
