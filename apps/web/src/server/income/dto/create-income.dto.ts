import {
  IsNumber,
  IsPositive,
  IsOptional,
  IsString,
  IsIn,
  IsDateString,
} from 'class-validator';
import { CURRENCIES, type Currency } from '../../common/currencies';

export class CreateIncomeDto {
  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsOptional()
  @IsIn(CURRENCIES)
  currency?: Currency;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['pending', 'paid', 'overdue'])
  status?: string;

  @IsDateString()
  date!: string;
}
