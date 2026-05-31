import api from '@/lib/axios';
import type { StudyResult, CreateStudyResultDto, UpdateStudyResultDto } from '@/types/studyResult';
import type { PaginatedResponse } from '@/types/pagination';

interface StudyResultFilters {
  patientId?: string;
  doctorId?: string;
  appointmentId?: string;
  page?: number;
  limit?: number;
}

export const studyResultsService = {
  getAll: (filters: StudyResultFilters = {}): Promise<PaginatedResponse<StudyResult>> => {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined));
    return api.get<PaginatedResponse<StudyResult>>('/study-results', { params }).then((r) => r.data);
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
