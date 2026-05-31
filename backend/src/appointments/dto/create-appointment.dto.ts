import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty() @IsUUID() patientId: string;
  @ApiProperty() @IsUUID() doctorId: string;

  @ApiPropertyOptional() @IsOptional() @IsUUID() studyTypeId?: string;

  @ApiProperty({ example: '2026-06-01T10:00:00Z' })
  @IsDateString()
  scheduledDate: string;

  @ApiProperty({ example: 30, description: 'Duration in minutes' })
  @IsInt()
  @Min(5)
  duration: number;

  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
