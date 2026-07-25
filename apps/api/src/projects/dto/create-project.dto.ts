import {
  IsString,
  IsOptional,
  IsIn,
  IsDateString,
  IsNumber,
  IsPositive,
  Min,
} from 'class-validator';
import { CURRENCIES, type Currency } from '../../common/currencies';

export const DEAL_TYPES = ['ongoing', 'one_time'] as const;
export type DealType = (typeof DEAL_TYPES)[number];

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsIn(['active', 'completed', 'on_hold'])
  status?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsIn(DEAL_TYPES)
  dealType?: DealType;

  /** One-time sale only: the single sale amount, recorded as this project's sole income entry. */
  @IsOptional()
  @IsNumber()
  @IsPositive()
  saleAmount?: number;

  @IsOptional()
  @IsIn(CURRENCIES)
  saleCurrency?: Currency;

  /** One-time sale only: optional cost, recorded as this project's sole expense entry. */
  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;
}
