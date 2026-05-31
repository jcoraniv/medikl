import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
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
};

const mockUserRepo = {
  findOne: jest.fn(),
};

describe('AppointmentsService', () => {
  let service: AppointmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: getRepositoryToken(Appointment), useValue: mockAppointmentRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates and returns an appointment', async () => {
      mockUserRepo.findOne
        .mockResolvedValueOnce(mockPatient)
        .mockResolvedValueOnce(mockDoctor);
      mockAppointmentRepo.create.mockReturnValue(mockAppointment);
      mockAppointmentRepo.save.mockResolvedValue(mockAppointment);

      const result = await service.create({
        patientId: mockPatient.id,
        doctorId: mockDoctor.id,
        scheduledDate: '2026-06-01T10:00:00Z',
        duration: 30,
      });

      expect(result).toEqual(mockAppointment);
      expect(mockAppointmentRepo.save).toHaveBeenCalled();
    });

    it('throws NotFoundException when patient does not exist', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create({ patientId: 'bad-id', doctorId: mockDoctor.id, scheduledDate: '2026-06-01T10:00:00Z', duration: 30 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when doctor does not exist', async () => {
      mockUserRepo.findOne
        .mockResolvedValueOnce(mockPatient)
        .mockResolvedValueOnce(null);

      await expect(
        service.create({ patientId: mockPatient.id, doctorId: 'bad-id', scheduledDate: '2026-06-01T10:00:00Z', duration: 30 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('returns the appointment when found', async () => {
      mockAppointmentRepo.findOne.mockResolvedValue(mockAppointment);

      const result = await service.findOne('appt-uuid');

      expect(result).toEqual(mockAppointment);
    });

    it('throws NotFoundException when appointment does not exist', async () => {
      mockAppointmentRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancel', () => {
    it('sets status to cancelled', async () => {
      mockAppointmentRepo.findOne.mockResolvedValue({ ...mockAppointment });
      mockAppointmentRepo.save.mockImplementation((a) => Promise.resolve(a));

      const result = await service.cancel('appt-uuid');

      expect(result.status).toBe(AppointmentStatus.CANCELLED);
    });

    it('throws BadRequestException when appointment is already completed', async () => {
      mockAppointmentRepo.findOne.mockResolvedValue({ ...mockAppointment, status: AppointmentStatus.COMPLETED });

      await expect(service.cancel('appt-uuid')).rejects.toThrow(BadRequestException);
    });
  });

  describe('complete', () => {
    it('sets status to completed', async () => {
      mockAppointmentRepo.findOne.mockResolvedValue({ ...mockAppointment });
      mockAppointmentRepo.save.mockImplementation((a) => Promise.resolve(a));

      const result = await service.complete('appt-uuid');

      expect(result.status).toBe(AppointmentStatus.COMPLETED);
    });

    it('throws BadRequestException when appointment is already cancelled', async () => {
      mockAppointmentRepo.findOne.mockResolvedValue({ ...mockAppointment, status: AppointmentStatus.CANCELLED });

      await expect(service.complete('appt-uuid')).rejects.toThrow(BadRequestException);
    });
  });
});
