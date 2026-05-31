import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ActivitiesService } from '../activities/activities.service';
import { User, UserRole } from '../users/entities/user.entity';
import { AppointmentsService } from './appointments.service';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';

const mockPatient: User = {
  id: 'patient-uuid',
  code: 1,
  email: 'patient@test.com',
  fullName: 'Carlos López',
  passwordHash: 'hash',
  role: UserRole.PATIENT,
  phone: null,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockDoctor: User = {
  id: 'doctor-uuid',
  code: 2,
  email: 'doctor@test.com',
  fullName: 'Dra. García',
  passwordHash: 'hash',
  role: UserRole.DOCTOR,
  phone: null,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockAdmin: User = {
  id: 'admin-uuid',
  code: 3,
  email: 'admin@test.com',
  fullName: 'Admin User',
  passwordHash: 'hash',
  role: UserRole.ADMIN,
  phone: null,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockAppointment: Appointment = {
  id: 'appt-uuid',
  code: 1,
  patientId: mockPatient.id,
  patient: mockPatient,
  doctorId: mockDoctor.id,
  doctor: mockDoctor,
  studyTypeId: null,
  studyType: null,
  scheduledDate: new Date('2026-06-01T10:00:00Z'),
  duration: 30,
  reason: 'Routine check',
  notes: null,
  status: AppointmentStatus.SCHEDULED,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockAppointmentRepo = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findAndCount: jest.fn(),
};

const DEFAULT_PAGINATION = { page: 1, limit: 10 };

const mockUserRepo = {
  findOne: jest.fn(),
};

const mockActivitiesService = {
  createActivity: jest.fn(),
};

describe('AppointmentsService', () => {
  let service: AppointmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: getRepositoryToken(Appointment), useValue: mockAppointmentRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: ActivitiesService, useValue: mockActivitiesService },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
    jest.clearAllMocks();
  });

  // ─── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('admin creates appointment with explicit doctorId', async () => {
      mockUserRepo.findOne
        .mockResolvedValueOnce(mockPatient)
        .mockResolvedValueOnce(mockDoctor);
      mockAppointmentRepo.create.mockReturnValue(mockAppointment);
      mockAppointmentRepo.save.mockResolvedValue(mockAppointment);
      mockAppointmentRepo.findOne.mockResolvedValue(mockAppointment);

      const result = await service.create(
        { patientId: mockPatient.id, doctorId: mockDoctor.id, scheduledDate: '2026-06-01T10:00:00Z', duration: 30 },
        mockAdmin,
      );

      expect(result).toEqual(mockAppointment);
      expect(mockActivitiesService.createActivity).toHaveBeenCalled();
    });

    it('doctor is auto-assigned as doctorId regardless of DTO', async () => {
      mockUserRepo.findOne
        .mockResolvedValueOnce(mockPatient)
        .mockResolvedValueOnce(mockDoctor);
      mockAppointmentRepo.create.mockReturnValue(mockAppointment);
      mockAppointmentRepo.save.mockResolvedValue(mockAppointment);
      mockAppointmentRepo.findOne.mockResolvedValue(mockAppointment);

      await service.create(
        { patientId: mockPatient.id, scheduledDate: '2026-06-01T10:00:00Z', duration: 30 },
        mockDoctor,
      );

      // The create call should use currentUser.id, not any DTO doctorId
      expect(mockAppointmentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ doctorId: mockDoctor.id }),
      );
    });

    it('throws BadRequestException when admin omits doctorId', async () => {
      await expect(
        service.create({ patientId: mockPatient.id, scheduledDate: '2026-06-01T10:00:00Z', duration: 30 }, mockAdmin),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when patient does not exist', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create({ patientId: 'bad-id', scheduledDate: '2026-06-01T10:00:00Z', duration: 30 }, mockDoctor),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when doctor does not exist', async () => {
      mockUserRepo.findOne
        .mockResolvedValueOnce(mockPatient)
        .mockResolvedValueOnce(null);

      await expect(
        service.create({ patientId: mockPatient.id, scheduledDate: '2026-06-01T10:00:00Z', duration: 30 }, mockDoctor),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── findAll ─────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns all appointments for admin without scope filter', async () => {
      mockAppointmentRepo.findAndCount.mockResolvedValue([[mockAppointment], 1]);

      const result = await service.findAll(mockAdmin, DEFAULT_PAGINATION);

      expect(result.data).toEqual([mockAppointment]);
      expect(mockAppointmentRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });

    it('scopes appointments by doctorId for doctor role', async () => {
      mockAppointmentRepo.findAndCount.mockResolvedValue([[mockAppointment], 1]);

      await service.findAll(mockDoctor, DEFAULT_PAGINATION);

      expect(mockAppointmentRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { doctorId: mockDoctor.id } }),
      );
    });

    it('scopes appointments by patientId for patient role', async () => {
      mockAppointmentRepo.findAndCount.mockResolvedValue([[mockAppointment], 1]);

      await service.findAll(mockPatient, DEFAULT_PAGINATION);

      expect(mockAppointmentRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { patientId: mockPatient.id } }),
      );
    });

    it('patient cannot override their own patientId via query param', async () => {
      mockAppointmentRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(mockPatient, DEFAULT_PAGINATION, 'other-patient-uuid');

      const call = mockAppointmentRepo.findAndCount.mock.calls[0][0];
      expect(call.where.patientId).toBe(mockPatient.id);
    });
  });

  // ─── findOne ─────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns the appointment for an admin', async () => {
      mockAppointmentRepo.findOne.mockResolvedValue(mockAppointment);

      const result = await service.findOne('appt-uuid', mockAdmin);

      expect(result).toEqual(mockAppointment);
    });

    it('returns the appointment when the doctor owns it', async () => {
      mockAppointmentRepo.findOne.mockResolvedValue(mockAppointment);

      const result = await service.findOne('appt-uuid', mockDoctor);

      expect(result).toEqual(mockAppointment);
    });

    it('returns the appointment when the patient owns it', async () => {
      mockAppointmentRepo.findOne.mockResolvedValue(mockAppointment);

      const result = await service.findOne('appt-uuid', mockPatient);

      expect(result).toEqual(mockAppointment);
    });

    it('throws ForbiddenException when a doctor accesses another doctor\'s appointment', async () => {
      const otherDoctor: User = { ...mockDoctor, id: 'other-doctor-uuid' };
      mockAppointmentRepo.findOne.mockResolvedValue(mockAppointment);

      await expect(service.findOne('appt-uuid', otherDoctor)).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when a patient accesses another patient\'s appointment', async () => {
      const otherPatient: User = { ...mockPatient, id: 'other-patient-uuid' };
      mockAppointmentRepo.findOne.mockResolvedValue(mockAppointment);

      await expect(service.findOne('appt-uuid', otherPatient)).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when appointment does not exist', async () => {
      mockAppointmentRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('bad-id', mockAdmin)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── cancel ──────────────────────────────────────────────────────────────────

  describe('cancel', () => {
    it('sets status to cancelled', async () => {
      const cancelled = { ...mockAppointment, status: AppointmentStatus.CANCELLED };
      mockAppointmentRepo.findOne
        .mockResolvedValueOnce({ ...mockAppointment })
        .mockResolvedValueOnce(cancelled);
      mockAppointmentRepo.save.mockImplementation((a) => Promise.resolve(a));

      const result = await service.cancel('appt-uuid', mockAdmin);

      expect(result.status).toBe(AppointmentStatus.CANCELLED);
    });

    it('throws BadRequestException when appointment is already completed', async () => {
      mockAppointmentRepo.findOne.mockResolvedValue({ ...mockAppointment, status: AppointmentStatus.COMPLETED });

      await expect(service.cancel('appt-uuid', mockAdmin)).rejects.toThrow(BadRequestException);
    });

    it('throws ForbiddenException when doctor tries to cancel another doctor\'s appointment', async () => {
      const otherDoctor: User = { ...mockDoctor, id: 'other-doctor-uuid' };
      mockAppointmentRepo.findOne.mockResolvedValue(mockAppointment);

      await expect(service.cancel('appt-uuid', otherDoctor)).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── complete ────────────────────────────────────────────────────────────────

  describe('complete', () => {
    it('sets status to completed', async () => {
      const completed = { ...mockAppointment, status: AppointmentStatus.COMPLETED };
      mockAppointmentRepo.findOne
        .mockResolvedValueOnce({ ...mockAppointment })
        .mockResolvedValueOnce(completed);
      mockAppointmentRepo.save.mockImplementation((a) => Promise.resolve(a));

      const result = await service.complete('appt-uuid', mockAdmin);

      expect(result.status).toBe(AppointmentStatus.COMPLETED);
    });

    it('throws BadRequestException when appointment is already cancelled', async () => {
      mockAppointmentRepo.findOne.mockResolvedValue({ ...mockAppointment, status: AppointmentStatus.CANCELLED });

      await expect(service.complete('appt-uuid', mockAdmin)).rejects.toThrow(BadRequestException);
    });

    it('throws ForbiddenException when doctor tries to complete another doctor\'s appointment', async () => {
      const otherDoctor: User = { ...mockDoctor, id: 'other-doctor-uuid' };
      mockAppointmentRepo.findOne.mockResolvedValue(mockAppointment);

      await expect(service.complete('appt-uuid', otherDoctor)).rejects.toThrow(ForbiddenException);
    });
  });
});
