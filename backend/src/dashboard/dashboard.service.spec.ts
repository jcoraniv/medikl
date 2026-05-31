import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { Appointment, AppointmentStatus } from '../appointments/entities/appointment.entity';
import { DashboardService } from './dashboard.service';

const mockUserRepo = { count: jest.fn() };
const mockAppointmentRepo = { count: jest.fn() };

const makeUser = (role: UserRole, id = 'user-uuid'): User => ({ id, role } as User);

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(Appointment), useValue: mockAppointmentRepo },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    jest.clearAllMocks();
  });

  describe('getStats — admin role', () => {
    const admin = makeUser(UserRole.ADMIN);

    it('returns counts for patients, doctors, appointments, pending, this-week and cancelled', async () => {
      mockUserRepo.count.mockResolvedValueOnce(5).mockResolvedValueOnce(2);
      mockAppointmentRepo.count.mockResolvedValueOnce(20).mockResolvedValueOnce(8).mockResolvedValueOnce(4).mockResolvedValueOnce(3);

      const result = await service.getStats(admin);

      expect(result).toMatchObject({ totalPatients: 5, totalDoctors: 2, totalAppointments: 20, pendingResults: 8, patientsThisWeek: 4, cancelledAppointments: 3 });
    });

    it('queries patients and doctors with correct role filters', async () => {
      mockUserRepo.count.mockResolvedValue(0);
      mockAppointmentRepo.count.mockResolvedValue(0);

      await service.getStats(admin);

      expect(mockUserRepo.count).toHaveBeenCalledWith({ where: { role: UserRole.PATIENT } });
      expect(mockUserRepo.count).toHaveBeenCalledWith({ where: { role: UserRole.DOCTOR } });
    });

    it('counts pending as scheduled appointments', async () => {
      mockUserRepo.count.mockResolvedValue(0);
      mockAppointmentRepo.count.mockResolvedValue(0);

      await service.getStats(admin);

      expect(mockAppointmentRepo.count).toHaveBeenCalledWith({ where: { status: AppointmentStatus.SCHEDULED } });
    });

    it('counts all appointments without a where clause', async () => {
      mockUserRepo.count.mockResolvedValue(0);
      mockAppointmentRepo.count.mockResolvedValue(0);

      await service.getStats(admin);

      expect(mockAppointmentRepo.count).toHaveBeenCalledWith();
    });

    it('counts this-week patients as completed appointments with scheduledDate in range', async () => {
      mockUserRepo.count.mockResolvedValue(0);
      mockAppointmentRepo.count.mockResolvedValue(0);

      await service.getStats(admin);

      const calls = mockAppointmentRepo.count.mock.calls;
      const weekCall = calls.find(
        (args: [{ where: Record<string, unknown> }]) =>
          args[0]?.where?.status === AppointmentStatus.COMPLETED && args[0]?.where?.scheduledDate !== undefined,
      );
      expect(weekCall).toBeDefined();
    });

    it('counts cancelled appointments scoped to the current year', async () => {
      mockUserRepo.count.mockResolvedValue(0);
      mockAppointmentRepo.count.mockResolvedValue(0);

      await service.getStats(admin);

      const calls = mockAppointmentRepo.count.mock.calls;
      const cancelledCall = calls.find(
        (args: [{ where: Record<string, unknown> }]) =>
          args[0]?.where?.status === AppointmentStatus.CANCELLED && args[0]?.where?.scheduledDate !== undefined,
      );
      expect(cancelledCall).toBeDefined();
    });
  });

  describe('getStats — doctor role', () => {
    const doctor = makeUser(UserRole.DOCTOR, 'doctor-uuid');

    it('returns appointments, pending, this-week and cancelled scoped to the doctor', async () => {
      mockAppointmentRepo.count.mockResolvedValueOnce(7).mockResolvedValueOnce(3).mockResolvedValueOnce(2).mockResolvedValueOnce(1);

      const result = await service.getStats(doctor);

      expect(result.totalAppointments).toBe(7);
      expect(result.pendingResults).toBe(3);
      expect(result.patientsThisWeek).toBe(2);
      expect(result.cancelledAppointments).toBe(1);
    });

    it('returns 0 for totalPatients and totalDoctors', async () => {
      mockAppointmentRepo.count.mockResolvedValue(0);

      const result = await service.getStats(doctor);

      expect(result.totalPatients).toBe(0);
      expect(result.totalDoctors).toBe(0);
    });

    it('does not query user counts', async () => {
      mockAppointmentRepo.count.mockResolvedValue(0);

      await service.getStats(doctor);

      expect(mockUserRepo.count).not.toHaveBeenCalled();
    });

    it('filters appointments and pending by doctorId', async () => {
      mockAppointmentRepo.count.mockResolvedValue(0);

      await service.getStats(doctor);

      expect(mockAppointmentRepo.count).toHaveBeenCalledWith({ where: { doctorId: 'doctor-uuid' } });
      expect(mockAppointmentRepo.count).toHaveBeenCalledWith({
        where: { doctorId: 'doctor-uuid', status: AppointmentStatus.SCHEDULED },
      });
    });

    it('filters this-week patients by doctorId and completed status', async () => {
      mockAppointmentRepo.count.mockResolvedValue(0);

      await service.getStats(doctor);

      const calls = mockAppointmentRepo.count.mock.calls;
      const weekCall = calls.find(
        (args: [{ where: Record<string, unknown> }]) =>
          args[0]?.where?.doctorId === 'doctor-uuid' &&
          args[0]?.where?.status === AppointmentStatus.COMPLETED &&
          args[0]?.where?.scheduledDate !== undefined,
      );
      expect(weekCall).toBeDefined();
    });

    it('filters cancelled appointments by doctorId and current year', async () => {
      mockAppointmentRepo.count.mockResolvedValue(0);

      await service.getStats(doctor);

      const calls = mockAppointmentRepo.count.mock.calls;
      const cancelledCall = calls.find(
        (args: [{ where: Record<string, unknown> }]) =>
          args[0]?.where?.doctorId === 'doctor-uuid' &&
          args[0]?.where?.status === AppointmentStatus.CANCELLED &&
          args[0]?.where?.scheduledDate !== undefined,
      );
      expect(cancelledCall).toBeDefined();
    });
  });
});
