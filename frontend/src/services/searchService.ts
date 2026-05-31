import api from '@/lib/axios';

export interface ActivitySnapshot {
  patient?:    { fullName?: string; code?: number };
  doctor?:     { fullName?: string };
  findings?:   string;
  conclusion?: string;
  appointment?: {
    id?:           string;
    code?:         number;
    scheduledDate?: string;
    duration?:     number;
    reason?:       string;
    notes?:        string;
    studyType?:    { name?: string };
  };
}

export interface SearchActivity {
  id:          string;
  type:        string;
  patientId:   string;
  entityId:    string;
  entityType:  string;
  snapshot:    ActivitySnapshot;
  generatedText: string;
  createdAt:   string;
}

export interface SearchResult {
  activity: SearchActivity;
  score:    number;
}

export const searchService = {
  search: (q: string, limit = 10): Promise<SearchResult[]> =>
    api.get<SearchResult[]>('/search', { params: { q, limit } }).then((r) => r.data),
};
