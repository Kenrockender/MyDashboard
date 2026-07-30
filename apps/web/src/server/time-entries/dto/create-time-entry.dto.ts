import {
  IsNumber,
  IsPositive,
  IsOptional,
  IsString,
  IsIn,
  IsDateString,
} from 'class-validator';
import { CURRENCIES, type Currency } from '../../common/currencies';

export class CreateTimeEntryDto {
  @IsNumber()
  @IsPositive()
  hours!: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  date!: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  hourlyRate?: number;

  @IsOptional()
  @IsIn(CURRENCIES)
  currency?: Currency;
}
