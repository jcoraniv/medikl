import type { User } from './auth';
import type { Appointment } from './appointment';

export interface StudyResult {
  id: string;
  appointmentId: string;
  appointment: Appointment;
  patientId: string;
  patient: User;
  doctorId: string;
  doctor: User;
  findings: string;
  conclusion: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudyResultDto {
  appointmentId: string;
  findings: string;
  conclusion?: string;
}

export interface UpdateStudyResultDto {
  findings?: string;
  conclusion?: string;
}
