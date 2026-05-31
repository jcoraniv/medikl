import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class UpdateAppointmentDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() doctorId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() studyTypeId?: string;

  @ApiPropertyOptional() @IsOptional() @IsDateString() scheduledDate?: string;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(5) duration?: number;

  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
