import api from '@/lib/axios';
import type { User, UserRole } from '@/types/auth';

export interface AppUser {
  id: string;
  code: number;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  createdAt: string;
  deletedAt: string | null;
}

export interface PaginatedUsers {
  data: AppUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateUserPayload {
  fullName: string;
  email: string;
  password: string;
  phone?: string | null;
  role?: string;
}

export const usersService = {
  // existing — used by appointment form dropdowns
  getByRole: (role: UserRole): Promise<User[]> =>
    api.get<User[]>('/users', { params: { role } }).then((r) => r.data),

  // admin: all users paginated
  findAll: (page = 1, limit = 10): Promise<PaginatedUsers> =>
    api.get<PaginatedUsers>('/users/all', { params: { page, limit } }).then((r) => r.data),

  // doctor: patients only paginated
  findPatients: (page = 1, limit = 10): Promise<PaginatedUsers> =>
    api.get<PaginatedUsers>('/users/patients', { params: { page, limit } }).then((r) => r.data),

  // admin: create user with any role
  create: (data: CreateUserPayload): Promise<AppUser> =>
    api.post<AppUser>('/users', data).then((r) => r.data),

  update: (id: string, data: Pick<AppUser, 'fullName' | 'email' | 'phone'>): Promise<AppUser> =>
    api.patch<AppUser>(`/users/patients/${id}`, data).then((r) => r.data),

  softDelete: (id: string): Promise<void> =>
    api.delete(`/users/patients/${id}`).then((r) => r.data),
};
