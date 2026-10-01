import { IsIn, IsOptional } from 'class-validator';
import type { IncomeType } from '../../tax/calculate-pph-umkm';

export class UpdateSettingsDto {
  // Optional so a PATCH can update settings piecemeal without clearing this
  // one; when present it must be one of the two known income types. There is
  // no way to un-answer the question back to `undefined` from the form — a
  // user who picked an answer picks the other answer, never a blank.
  @IsOptional()
  @IsIn(['business', 'professional'])
  incomeType?: IncomeType;
}
