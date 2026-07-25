import {
  IsNumber,
  IsPositive,
  IsOptional,
  IsString,
  IsIn,
  IsDateString,
} from 'class-validator';
import { CURRENCIES, type Currency } from '../../common/currencies';

const EXPENSE_CATEGORIES = [
  'hosting',
  'domain',
  'api_usage',
  'software_subscription',
  'freelancer',
  'marketing',
  'miscellaneous',
];

export class CreateExpenseDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsIn(EXPENSE_CATEGORIES)
  category: string;

  @IsOptional()
  @IsIn(CURRENCIES)
  currency?: Currency;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  date: string;
}
