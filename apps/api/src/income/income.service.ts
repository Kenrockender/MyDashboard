import { Injectable, NotFoundException } from '@nestjs/common';
import { IncomeStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIncomeDto } from './dto/create-income.dto';

@Injectable()
export class IncomeService {
  constructor(private prisma: PrismaService) {}

  private async assertProjectOwnership(userId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({ where: { id: projectId, userId } });
    if (!project) throw new NotFoundException('Project not found');
  }

  async create(userId: string, projectId: string, dto: CreateIncomeDto) {
    await this.assertProjectOwnership(userId, projectId);
    return this.prisma.income.create({
      data: {
        projectId,
        amount: dto.amount,
        description: dto.description,
        status: dto.status as IncomeStatus | undefined,
        date: new Date(dto.date),
      },
    });
  }

  async findAll(userId: string, projectId: string) {
    await this.assertProjectOwnership(userId, projectId);
    return this.prisma.income.findMany({ where: { projectId }, orderBy: { date: 'desc' } });
  }

  async update(userId: string, id: string, dto: Partial<CreateIncomeDto>) {
    const income = await this.prisma.income.findFirst({ where: { id, project: { userId } } });
    if (!income) throw new NotFoundException('Income not found');
    return this.prisma.income.update({
      where: { id },
      data: {
        amount: dto.amount,
        description: dto.description,
        status: dto.status as IncomeStatus | undefined,
        date: dto.date ? new Date(dto.date) : undefined,
      },
    });
  }

  async remove(userId: string, id: string) {
    const income = await this.prisma.income.findFirst({ where: { id, project: { userId } } });
    if (!income) throw new NotFoundException('Income not found');
    return this.prisma.income.delete({ where: { id } });
  }
}
