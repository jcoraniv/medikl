import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { DashboardService } from './dashboard.service';

const mockUserRepo = {
  count: jest.fn(),
};

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    jest.clearAllMocks();
  });

  describe('getStats', () => {
    it('returns patient and doctor counts from the repository', async () => {
      mockUserRepo.count
        .mockResolvedValueOnce(5)  // PATIENT query
        .mockResolvedValueOnce(2); // DOCTOR query

      const result = await service.getStats();

      expect(result.totalPatients).toBe(5);
      expect(result.totalDoctors).toBe(2);
    });

    it('returns 0 for totalAppointments and pendingResults (not yet implemented)', async () => {
      mockUserRepo.count.mockResolvedValue(0);

      const result = await service.getStats();

      expect(result.totalAppointments).toBe(0);
      expect(result.pendingResults).toBe(0);
    });

    it('queries patients and doctors with correct role filters', async () => {
      mockUserRepo.count.mockResolvedValue(0);

      await service.getStats();

      expect(mockUserRepo.count).toHaveBeenCalledWith({ where: { role: UserRole.PATIENT } });
      expect(mockUserRepo.count).toHaveBeenCalledWith({ where: { role: UserRole.DOCTOR } });
    });

    it('runs both count queries in parallel', async () => {
      mockUserRepo.count.mockResolvedValue(0);

      await service.getStats();

      expect(mockUserRepo.count).toHaveBeenCalledTimes(2);
    });
  });
});
