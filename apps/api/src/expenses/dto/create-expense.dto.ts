import { IsNumber, IsPositive, IsOptional, IsString, IsIn, IsDateString } from 'class-validator';

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
  @IsString()
  description?: string;

  @IsDateString()
  date: string;
}
