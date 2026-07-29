import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { AttachmentsService } from './attachments.service';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';

@Controller()
export class AttachmentsController {
  constructor(private attachmentsService: AttachmentsService) {}

  @Post('expenses/:expenseId/attachments')
  async create(
    @Param('expenseId') expenseId: string,
    @Body() dto: CreateAttachmentDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.attachmentsService.create(user.userId, expenseId, dto);
    return { data };
  }

  @Get('expenses/:expenseId/attachments')
  async findAll(
    @Param('expenseId') expenseId: string,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.attachmentsService.findAllForExpense(user.userId, expenseId);
    return { data };
  }

  @Delete('attachments/:id')
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const data = await this.attachmentsService.remove(user.userId, id);
    return { data };
  }
}
