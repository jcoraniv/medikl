import api from '@/lib/axios';
import type { AuthResponse, LoginPayload } from '@/types/auth';
import type { CreateUserDto } from '@/types/user';

export const authService = {
  login: (payload: LoginPayload) =>
    api.post<AuthResponse>('/auth/login', payload).then((r) => r.data),

  register: (payload: CreateUserDto) =>
    api.post<AuthResponse>('/auth/register', payload).then((r) => r.data),

  profile: () =>
    api.get('/auth/profile').then((r) => r.data),
};
