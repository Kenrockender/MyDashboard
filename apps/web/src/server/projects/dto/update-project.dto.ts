import { IsString, IsOptional, IsIn, IsDateString } from 'class-validator';

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
}
