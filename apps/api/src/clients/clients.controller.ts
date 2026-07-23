import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';

@Controller('clients')
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Post()
  async create(@Body() dto: CreateClientDto, @CurrentUser() user: AuthUser) {
    const data = await this.clientsService.create(user.userId, dto);
    return { data };
  }

  @Get()
  async findAll(@CurrentUser() user: AuthUser, @Query('search') search?: string) {
    const data = await this.clientsService.findAll(user.userId, search);
    return { data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const data = await this.clientsService.findOne(user.userId, id);
    return { data };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: Partial<CreateClientDto>, @CurrentUser() user: AuthUser) {
    const data = await this.clientsService.update(user.userId, id, dto);
    return { data };
  }
}
