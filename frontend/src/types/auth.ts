export type UserRole = 'admin' | 'doctor' | 'patient';

export interface User {
  id: string;
  code: number;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}
