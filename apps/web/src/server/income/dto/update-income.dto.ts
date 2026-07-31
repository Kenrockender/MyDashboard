import { IsNumber, IsPositive, IsOptional, IsString, IsIn, IsDateString } from 'class-validator';
import { CURRENCIES, type Currency } from '../../common/currencies';

export class UpdateIncomeDto {
  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;

  @IsOptional()
  @IsIn(CURRENCIES)
  currency?: Currency;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['pending', 'paid', 'overdue'])
  status?: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}
