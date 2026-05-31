import api from '@/lib/axios';
import type { StudyType } from '@/types/appointment';

export const studyTypesService = {
  getAll: (): Promise<StudyType[]> =>
    api.get<StudyType[]>('/study-types').then((r) => r.data),
};
