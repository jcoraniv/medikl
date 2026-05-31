import api from '@/lib/axios';

export interface ClinicalHistoryResult {
  id: string;
  findings: string;
  conclusion: string | null;
  createdAt: string;
}

export interface ClinicalHistoryAppointment {
  id: string;
  code: number;
  scheduledDate: string;
  duration: number;
  status: string;
  reason: string | null;
  notes: string | null;
  doctor: { id: string; fullName: string };
  studyType: { id: string; name: string } | null;
  studyResult: ClinicalHistoryResult | null;
}

export interface ClinicalHistory {
  patient: { id: string; code: number; fullName: string; email: string };
  appointments: ClinicalHistoryAppointment[];
}

export const clinicalHistoryService = {
  findByPatientCode: (code: number): Promise<ClinicalHistory> =>
    api.get<ClinicalHistory>(`/clinical-history/${code}`).then((r) => r.data),
};
