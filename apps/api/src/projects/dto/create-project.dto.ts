import { IsString, IsOptional, IsIn, IsDateString } from 'class-validator';

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
}
