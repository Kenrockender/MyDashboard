import { IsOptional, IsIn, IsDateString, IsString } from 'class-validator';

const INVOICE_STATUSES = ['draft', 'sent', 'paid', 'overdue'];

export class UpdateInvoiceDto {
  @IsOptional()
  @IsIn(INVOICE_STATUSES)
  status?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
