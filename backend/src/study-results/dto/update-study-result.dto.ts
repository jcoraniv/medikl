import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateStudyResultDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(10) findings?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() conclusion?: string;
}
