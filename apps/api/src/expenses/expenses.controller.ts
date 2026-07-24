import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';

@Controller()
export class ExpensesController {
  constructor(private expensesService: ExpensesService) {}

  @Post('projects/:projectId/expenses')
  async create(@Param('projectId') projectId: string, @Body() dto: CreateExpenseDto, @CurrentUser() user: AuthUser) {
    const data = await this.expensesService.create(user.userId, projectId, dto);
    return { data };
  }

  @Get('projects/:projectId/expenses')
  async findAll(@Param('projectId') projectId: string, @CurrentUser() user: AuthUser) {
    const data = await this.expensesService.findAll(user.userId, projectId);
    return { data };
  }

  @Patch('expenses/:id')
  async update(@Param('id') id: string, @Body() dto: Partial<CreateExpenseDto>, @CurrentUser() user: AuthUser) {
    const data = await this.expensesService.update(user.userId, id, dto);
    return { data };
  }

  @Delete('expenses/:id')
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const data = await this.expensesService.remove(user.userId, id);
    return { data };
  }
}
