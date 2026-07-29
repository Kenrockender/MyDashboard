import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';
import { PdfService } from '../pdf/pdf.service';

@Controller()
export class InvoicesController {
  constructor(
    private invoicesService: InvoicesService,
    private pdfService: PdfService,
  ) {}

  @Post('projects/:projectId/invoices')
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateInvoiceDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.invoicesService.create(
      user.userId,
      projectId,
      dto,
    );
    return { data };
  }

  @Get('projects/:projectId/invoices')
  async findAllForProject(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.invoicesService.findAllForProject(
      user.userId,
      projectId,
    );
    return { data };
  }

  @Get('invoices')
  async findAllForUser(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: string,
  ) {
    const data = await this.invoicesService.findAllForUser(
      user.userId,
      status,
    );
    return { data };
  }

  @Get('invoices/:id')
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const data = await this.invoicesService.findOne(user.userId, id);
    return { data };
  }

  @Patch('invoices/:id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.invoicesService.update(user.userId, id, dto);
    return { data };
  }

  // The one deliberate exception to this codebase's `{ data }` JSON envelope
  // — a PDF isn't JSON, so this route bypasses Nest's response handling via
  // @Res() and writes the binary body directly.
  @Get('invoices/:id/pdf')
  async downloadPdf(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ) {
    const { invoice, project, client, incomeLines } =
      await this.invoicesService.getPdfData(user.userId, id);
    const buffer = await this.pdfService.renderInvoice(
      invoice,
      project,
      client,
      incomeLines,
    );
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`,
    });
    res.send(buffer);
  }

  @Post('invoices/:id/send')
  async send(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const data = await this.invoicesService.send(user.userId, id);
    return { data };
  }

  @Delete('invoices/:id')
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const data = await this.invoicesService.remove(user.userId, id);
    return { data };
  }
}
