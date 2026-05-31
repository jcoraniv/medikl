import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ClinicalHistoryService } from '../clinical-history/clinical-history.service';
import { User, UserRole } from '../users/entities/user.entity';
import { ChatService } from './chat.service';

const mockAdmin = { id: 'admin-id', role: UserRole.ADMIN } as User;

const mockHistory = {
  patient: { id: 'p-1', code: 1, fullName: 'Carlos López', email: 'carlos@test.com' },
  appointments: [
    {
      id: 'appt-1',
      code: 100,
      scheduledDate: new Date('2025-01-15T10:00:00Z'),
      duration: 30,
      status: 'completed',
      reason: 'Rinitis crónica',
      notes: 'Se recetó clorfenamina',
      doctor: { id: 'd-1', fullName: 'Dra. García' },
      studyType: { id: 'st-1', name: 'Examen general' },
      studyResult: {
        id: 'r-1',
        findings: 'Mucosa nasal inflamada',
        conclusion: 'Rinitis alérgica',
        createdAt: new Date(),
      },
    },
  ],
};

describe('ChatService', () => {
  let service: ChatService;
  let clinicalHistoryService: { findByPatientCode: jest.Mock };
  let openaiCreate: jest.Mock;

  beforeEach(async () => {
    clinicalHistoryService = { findByPatientCode: jest.fn().mockResolvedValue(mockHistory) };
    openaiCreate = jest.fn().mockResolvedValue({
      choices: [{ message: { content: 'Respuesta de la IA.' } }],
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: ClinicalHistoryService, useValue: clinicalHistoryService },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('test-key') } },
      ],
    }).compile();

    service = module.get(ChatService);
    (service as any).openai = { chat: { completions: { create: openaiCreate } } };
  });

  it('fetches patient history using the provided code and currentUser', async () => {
    await service.ask({ query: 'Test', patientCode: 1, history: [] }, mockAdmin);

    expect(clinicalHistoryService.findByPatientCode).toHaveBeenCalledWith(1, mockAdmin);
  });

  it('includes the conversation history in the OpenAI call', async () => {
    const history = [
      { role: 'assistant' as const, content: 'Resumen anterior.' },
      { role: 'user' as const, content: 'Primera pregunta.' },
    ];

    await service.ask({ query: 'Segunda pregunta', patientCode: 1, history }, mockAdmin);

    const messages = openaiCreate.mock.calls[0][0].messages;
    expect(messages[1]).toEqual({ role: 'assistant', content: 'Resumen anterior.' });
    expect(messages[2]).toEqual({ role: 'user', content: 'Primera pregunta.' });
  });

  it('includes patient data and query in the last user message', async () => {
    await service.ask({ query: '¿Ha tenido rinitis?', patientCode: 1, history: [] }, mockAdmin);

    const messages = openaiCreate.mock.calls[0][0].messages;
    const lastMessage = messages[messages.length - 1];
    expect(lastMessage.role).toBe('user');
    expect(lastMessage.content).toContain('Carlos López');
    expect(lastMessage.content).toContain('PREGUNTA: ¿Ha tenido rinitis?');
  });

  it('includes appointment details in the context', async () => {
    await service.ask({ query: 'Test', patientCode: 1, history: [] }, mockAdmin);

    const messages = openaiCreate.mock.calls[0][0].messages;
    const userMessage = messages[messages.length - 1].content;
    expect(userMessage).toContain('Rinitis crónica');
    expect(userMessage).toContain('clorfenamina');
    expect(userMessage).toContain('Rinitis alérgica');
  });

  it('returns the AI answer string', async () => {
    const answer = await service.ask({ query: 'Test', patientCode: 1, history: [] }, mockAdmin);

    expect(answer).toBe('Respuesta de la IA.');
  });
});
