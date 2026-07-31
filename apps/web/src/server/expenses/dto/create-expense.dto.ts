import {
  IsNumber,
  IsPositive,
  IsOptional,
  IsString,
  IsIn,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { CURRENCIES, type Currency } from '../../common/currencies';

export const EXPENSE_CATEGORIES = [
  'hosting',
  'domain',
  'api_usage',
  'software_subscription',
  'freelancer',
  'marketing',
  'miscellaneous',
];

export const RECURRENCE_INTERVALS = ['weekly', 'monthly', 'yearly'] as const;
export type RecurrenceInterval = (typeof RECURRENCE_INTERVALS)[number];

export class CreateExpenseDto {
  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsIn(EXPENSE_CATEGORIES)
  category!: string;

  @IsOptional()
  @IsIn(CURRENCIES)
  currency?: Currency;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  date!: string;

  /** Marks this expense as a reminder for future occurrences (e.g. a monthly hosting bill) — never auto-creates new expense records, just surfaces an upcoming reminder. */
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsIn(RECURRENCE_INTERVALS)
  recurrenceInterval?: RecurrenceInterval;
}
