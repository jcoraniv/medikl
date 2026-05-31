import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateStudyResultDto {
  @ApiProperty() @IsUUID() appointmentId: string;

  @ApiProperty({ description: 'Clinical findings from the study' })
  @IsString()
  @MinLength(10)
  findings: string;

  @ApiPropertyOptional({ description: 'Clinical conclusion and recommendations' })
  @IsOptional()
  @IsString()
  conclusion?: string;
}
