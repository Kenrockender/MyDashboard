import { IsNumber, IsPositive, IsOptional, IsString, IsIn, IsDateString } from 'class-validator';
import { CURRENCIES, type Currency } from '../../common/currencies';
import { EXPENSE_CATEGORIES } from './create-expense.dto';

export class UpdateExpenseDto {
  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;

  @IsOptional()
  @IsIn(CURRENCIES)
  currency?: Currency;

  @IsOptional()
  @IsIn(EXPENSE_CATEGORIES)
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}
