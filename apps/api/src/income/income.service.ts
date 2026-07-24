import { Injectable, NotFoundException } from '@nestjs/common';
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
    return this.prisma.income.create({ data: { ...dto, projectId } });
  }

  async findAll(userId: string, projectId: string) {
    await this.assertProjectOwnership(userId, projectId);
    return this.prisma.income.findMany({ where: { projectId }, orderBy: { date: 'desc' } });
  }

  async update(userId: string, id: string, dto: Partial<CreateIncomeDto>) {
    const income = await this.prisma.income.findFirst({ where: { id, project: { userId } } });
    if (!income) throw new NotFoundException('Income not found');
    return this.prisma.income.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    const income = await this.prisma.income.findFirst({ where: { id, project: { userId } } });
    if (!income) throw new NotFoundException('Income not found');
    return this.prisma.income.delete({ where: { id } });
  }
}
