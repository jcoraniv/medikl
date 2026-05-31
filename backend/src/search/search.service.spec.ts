import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ActivitiesService } from '../activities/activities.service';
import { ActivityType } from '../activities/entities/activity.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { SearchService } from './search.service';

const mockEmbedding = Array.from({ length: 8 }, (_, i) => i * 0.1);

const mockActivity = (id: string, patientId: string) => ({
  id,
  type: ActivityType.RESULT_CREATED,
  patientId,
  snapshot: {},
  embedding: mockEmbedding,
  createdAt: new Date(),
});

const adminUser  = { id: 'admin-id',  role: UserRole.ADMIN  } as User;
const doctorUser = { id: 'doctor-id', role: UserRole.DOCTOR } as User;
const patientUser = { id: 'patient-id', role: UserRole.PATIENT } as User;

describe('SearchService', () => {
  let service: SearchService;
  let activitiesService: { findAllWithEmbeddings: jest.Mock };
  let openaiCreate: jest.Mock;

  beforeEach(async () => {
    openaiCreate = jest.fn().mockResolvedValue({
      data: [{ embedding: mockEmbedding }],
    });

    activitiesService = { findAllWithEmbeddings: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: ActivitiesService, useValue: activitiesService },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('test-key') } },
      ],
    }).compile();

    service = module.get(SearchService);
    // Inject mock openai client
    (service as any).openai = { embeddings: { create: openaiCreate } };
  });

  describe('ownership scoping', () => {
    it('passes no patientId filter when caller is admin', async () => {
      activitiesService.findAllWithEmbeddings.mockResolvedValue([]);

      await service.search('dolor abdominal', adminUser);

      expect(activitiesService.findAllWithEmbeddings).toHaveBeenCalledWith(
        [ActivityType.RESULT_CREATED],
        undefined,
      );
    });

    it('passes no patientId filter when caller is doctor', async () => {
      activitiesService.findAllWithEmbeddings.mockResolvedValue([]);

      await service.search('dolor abdominal', doctorUser);

      expect(activitiesService.findAllWithEmbeddings).toHaveBeenCalledWith(
        [ActivityType.RESULT_CREATED],
        undefined,
      );
    });

    it('passes own patientId filter when caller is patient', async () => {
      activitiesService.findAllWithEmbeddings.mockResolvedValue([]);

      await service.search('dolor abdominal', patientUser);

      expect(activitiesService.findAllWithEmbeddings).toHaveBeenCalledWith(
        [ActivityType.RESULT_CREATED],
        'patient-id',
      );
    });
  });

  describe('result ranking', () => {
    it('returns results sorted by cosine similarity descending', async () => {
      const actA = { ...mockActivity('a', 'p1'), embedding: [1, 0, 0, 0, 0, 0, 0, 0] };
      const actB = { ...mockActivity('b', 'p2'), embedding: [0, 1, 0, 0, 0, 0, 0, 0] };
      activitiesService.findAllWithEmbeddings.mockResolvedValue([actA, actB]);
      // query embedding aligns with actA
      openaiCreate.mockResolvedValue({ data: [{ embedding: [1, 0, 0, 0, 0, 0, 0, 0] }] });

      const results = await service.search('test', adminUser);

      expect(results[0].activity.id).toBe('a');
      expect(results[0].score).toBeGreaterThan(results[1].score);
    });

    it('respects the limit parameter', async () => {
      const activities = Array.from({ length: 5 }, (_, i) =>
        mockActivity(`act-${i}`, 'p1'),
      );
      activitiesService.findAllWithEmbeddings.mockResolvedValue(activities);

      const results = await service.search('test', adminUser, 3);

      expect(results).toHaveLength(3);
    });
  });
});
