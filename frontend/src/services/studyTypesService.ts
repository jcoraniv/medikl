import api from '@/lib/axios';
import type { StudyType } from '@/types/appointment';

export interface StudyTypePayload {
  name: string;
  description?: string;
  duration: number;
}

export const studyTypesService = {
  getAll: (): Promise<StudyType[]> =>
    api.get<StudyType[]>('/study-types').then((r) => r.data),

  create: (dto: StudyTypePayload): Promise<StudyType> =>
    api.post<StudyType>('/study-types', dto).then((r) => r.data),

  update: (id: string, dto: Partial<StudyTypePayload>): Promise<StudyType> =>
    api.patch<StudyType>(`/study-types/${id}`, dto).then((r) => r.data),

  remove: (id: string): Promise<void> =>
    api.delete(`/study-types/${id}`).then(() => undefined),
};
