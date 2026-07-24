import {
  IsNumber,
  IsPositive,
  IsOptional,
  IsString,
  IsIn,
  IsDateString,
} from 'class-validator';

export class CreateIncomeDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['pending', 'paid', 'overdue'])
  status?: string;

  @IsDateString()
  date: string;
}
