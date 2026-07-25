import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';

@Controller('projects')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Post()
  async create(@Body() dto: CreateProjectDto, @CurrentUser() user: AuthUser) {
    return { data: await this.projectsService.create(user.userId, dto) };
  }

  @Get()
  async findAll(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: string,
    @Query('clientId') clientId?: string,
    @Query('search') search?: string,
    @Query('dealType') dealType?: string,
  ) {
    return {
      data: await this.projectsService.findAll(user.userId, {
        status,
        clientId,
        search,
        dealType,
      }),
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return { data: await this.projectsService.findOne(user.userId, id) };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateProjectDto>,
    @CurrentUser() user: AuthUser,
  ) {
    return { data: await this.projectsService.update(user.userId, id, dto) };
  }

  @Post(':id/archive')
  async archive(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return { data: await this.projectsService.archive(user.userId, id) };
  }
}
