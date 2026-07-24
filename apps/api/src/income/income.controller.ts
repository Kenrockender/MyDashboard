import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { IncomeService } from './income.service';
import { CreateIncomeDto } from './dto/create-income.dto';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';

@Controller()
export class IncomeController {
  constructor(private incomeService: IncomeService) {}

  @Post('projects/:projectId/income')
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateIncomeDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.incomeService.create(user.userId, projectId, dto);
    return { data };
  }

  @Get('projects/:projectId/income')
  async findAll(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.incomeService.findAll(user.userId, projectId);
    return { data };
  }

  @Patch('income/:id')
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateIncomeDto>,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.incomeService.update(user.userId, id, dto);
    return { data };
  }

  @Delete('income/:id')
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const data = await this.incomeService.remove(user.userId, id);
    return { data };
  }
}
