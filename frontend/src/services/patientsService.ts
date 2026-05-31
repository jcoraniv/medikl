import api from '@/lib/axios';

export interface Patient {
  id: string;
  code: number;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  createdAt: string;
  deletedAt: string | null;
}

export interface PaginatedPatients {
  data: Patient[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreatePatientPayload {
  fullName: string;
  email: string;
  password: string;
  phone?: string | null;
}

export const patientsService = {
  findAll: (page = 1, limit = 10): Promise<PaginatedPatients> =>
    api.get<PaginatedPatients>('/users/patients', { params: { page, limit } }).then((r) => r.data),

  create: (data: CreatePatientPayload): Promise<Patient> =>
    api.post<Patient>('/users/patients', data).then((r) => r.data),

  update: (id: string, data: Pick<Patient, 'fullName' | 'email' | 'phone'>): Promise<Patient> =>
    api.patch<Patient>(`/users/patients/${id}`, data).then((r) => r.data),

  softDelete: (id: string): Promise<void> =>
    api.delete(`/users/patients/${id}`).then((r) => r.data),
};
