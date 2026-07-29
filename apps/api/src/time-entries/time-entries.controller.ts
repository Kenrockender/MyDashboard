import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { TimeEntriesService } from './time-entries.service';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';

@Controller()
export class TimeEntriesController {
  constructor(private timeEntriesService: TimeEntriesService) {}

  @Post('projects/:projectId/time-entries')
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateTimeEntryDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.timeEntriesService.create(
      user.userId,
      projectId,
      dto,
    );
    return { data };
  }

  @Get('projects/:projectId/time-entries')
  async findAll(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.timeEntriesService.findAll(user.userId, projectId);
    return { data };
  }

  @Patch('time-entries/:id')
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateTimeEntryDto>,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.timeEntriesService.update(user.userId, id, dto);
    return { data };
  }

  @Post('time-entries/:id/log-income')
  async logAsIncome(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const data = await this.timeEntriesService.logAsIncome(user.userId, id);
    return { data };
  }

  @Delete('time-entries/:id')
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const data = await this.timeEntriesService.remove(user.userId, id);
    return { data };
  }
}
