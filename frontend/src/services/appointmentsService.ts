import api from '@/lib/axios';
import type { Appointment, CreateAppointmentDto, UpdateAppointmentDto, AppointmentStatus } from '@/types/appointment';

interface AppointmentFilters {
  patientId?: string;
  doctorId?: string;
  status?: AppointmentStatus;
}

export const appointmentsService = {
  getAll: (filters: AppointmentFilters = {}): Promise<Appointment[]> => {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined));
    return api.get<Appointment[]>('/appointments', { params }).then((r) => r.data);
  },

  getOne: (id: string): Promise<Appointment> =>
    api.get<Appointment>(`/appointments/${id}`).then((r) => r.data),

  create: (dto: CreateAppointmentDto): Promise<Appointment> =>
    api.post<Appointment>('/appointments', dto).then((r) => r.data),

  update: (id: string, dto: UpdateAppointmentDto): Promise<Appointment> =>
    api.patch<Appointment>(`/appointments/${id}`, dto).then((r) => r.data),

  cancel: (id: string): Promise<Appointment> =>
    api.patch<Appointment>(`/appointments/${id}/cancel`).then((r) => r.data),

  complete: (id: string): Promise<Appointment> =>
    api.patch<Appointment>(`/appointments/${id}/complete`).then((r) => r.data),
};
