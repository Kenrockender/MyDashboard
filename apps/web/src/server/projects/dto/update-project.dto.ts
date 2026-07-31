import { IsString, IsOptional, IsIn, IsDateString, IsNumber, IsPositive } from 'class-validator';
import { CURRENCIES, type Currency } from '../../common/currencies';

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  clientId?: string | null;

  @IsOptional()
  @IsIn(['active', 'completed', 'on_hold'])
  status?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  budget?: number | null;

  @IsOptional()
  @IsIn(CURRENCIES)
  budgetCurrency?: Currency | null;
}
