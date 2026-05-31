import api from '@/lib/axios';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AskPayload {
  query: string;
  patientCode: number;
  history: ChatMessage[];
}

export const chatService = {
  ask: (payload: AskPayload): Promise<string> =>
    api.post<{ answer: string }>('/chat/ask', payload).then((r) => r.data.answer),
};
