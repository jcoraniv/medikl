import type { UserRole } from './auth';

export interface CreateUserDto {
  email: string;
  fullName: string;
  password: string;
  role?: UserRole;
}
