import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  private async assertProjectOwnership(userId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({ where: { id: projectId, userId } });
    if (!project) throw new NotFoundException('Project not found');
  }

  async create(userId: string, projectId: string, dto: CreateExpenseDto) {
    await this.assertProjectOwnership(userId, projectId);
    return this.prisma.expense.create({ data: { ...dto, projectId } });
  }

  async findAll(userId: string, projectId: string) {
    await this.assertProjectOwnership(userId, projectId);
    return this.prisma.expense.findMany({ where: { projectId }, orderBy: { date: 'desc' } });
  }

  async update(userId: string, id: string, dto: Partial<CreateExpenseDto>) {
    const expense = await this.prisma.expense.findFirst({ where: { id, project: { userId } } });
    if (!expense) throw new NotFoundException('Expense not found');
    return this.prisma.expense.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    const expense = await this.prisma.expense.findFirst({ where: { id, project: { userId } } });
    if (!expense) throw new NotFoundException('Expense not found');
    return this.prisma.expense.delete({ where: { id } });
  }
}
