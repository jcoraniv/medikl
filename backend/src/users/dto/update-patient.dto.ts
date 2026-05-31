import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdatePatientDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;
}
