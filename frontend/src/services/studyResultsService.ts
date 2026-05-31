import api from '@/lib/axios';
import type { StudyResult, CreateStudyResultDto, UpdateStudyResultDto } from '@/types/studyResult';

interface StudyResultFilters {
  patientId?: string;
  doctorId?: string;
  appointmentId?: string;
}

export const studyResultsService = {
  getAll: (filters: StudyResultFilters = {}): Promise<StudyResult[]> => {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined));
    return api.get<StudyResult[]>('/study-results', { params }).then((r) => r.data);
  },

  getOne: (id: string): Promise<StudyResult> =>
    api.get<StudyResult>(`/study-results/${id}`).then((r) => r.data),

  getByAppointment: (appointmentId: string): Promise<StudyResult[]> =>
    api.get<StudyResult[]>(`/study-results/by-appointment/${appointmentId}`).then((r) => r.data),

  create: (dto: CreateStudyResultDto): Promise<StudyResult> =>
    api.post<StudyResult>('/study-results', dto).then((r) => r.data),

  update: (id: string, dto: UpdateStudyResultDto): Promise<StudyResult> =>
    api.patch<StudyResult>(`/study-results/${id}`, dto).then((r) => r.data),
};
