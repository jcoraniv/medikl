import api from '@/lib/axios';

export interface ActivitySnapshot {
  patient?: { fullName?: string; code?: number };
  doctor?: { fullName?: string };
  scheduledDate?: string;
  studyType?: { name?: string };
  reason?: string;
  findings?: string;
  conclusion?: string;
}

export interface SearchActivity {
  id: string;
  type: string;
  patientId: string;
  entityId: string;
  entityType: string;
  snapshot: ActivitySnapshot;
  generatedText: string;
  createdAt: string;
}

export interface SearchResult {
  activity: SearchActivity;
  score: number;
}

export const searchService = {
  search: (q: string, limit = 10): Promise<SearchResult[]> =>
    api.get<SearchResult[]>('/search', { params: { q, limit } }).then((r) => r.data),
};
