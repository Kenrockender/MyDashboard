import {
  IsArray,
  ArrayNotEmpty,
  IsString,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreateInvoiceDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  incomeIds!: string[];

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
