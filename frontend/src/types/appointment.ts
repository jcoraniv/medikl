import type { User } from './auth';

export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled';

export interface StudyType {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  address: string | null;
}

export interface Appointment {
  id: string;
  code: number;
  patientId: string;
  patient: User;
  doctorId: string;
  doctor: User;
  studyTypeId: string | null;
  studyType: StudyType | null;
  scheduledDate: string;
  duration: number;
  reason: string | null;
  notes: string | null;
  status: AppointmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentDto {
  patientId: string;
  doctorId: string;
  studyTypeId?: string;
  scheduledDate: string;
  duration: number;
  reason?: string;
  notes?: string;
}

export interface UpdateAppointmentDto {
  doctorId?: string;
  studyTypeId?: string;
  scheduledDate?: string;
  duration?: number;
  reason?: string;
  notes?: string;
}
