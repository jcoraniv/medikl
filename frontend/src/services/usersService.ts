import api from '@/lib/axios';
import type { User, UserRole } from '@/types/auth';

export const usersService = {
  getByRole: (role: UserRole): Promise<User[]> =>
    api.get<User[]>('/users', { params: { role } }).then((r) => r.data),
};
