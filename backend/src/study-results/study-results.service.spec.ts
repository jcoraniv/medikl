import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ActivitiesService } from '../activities/activities.service';
import { Appointment, AppointmentStatus } from '../appointments/entities/appointment.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { StudyResult } from './entities/study-result.entity';
import { StudyResultsService } from './study-results.service';

const APPOINTMENT_ID = 'appt-uuid-1';
const PATIENT_ID = 'patient-uuid-1';
const DOCTOR_ID = 'doctor-uuid-1';
const RESULT_ID = 'result-uuid-1';

const mockAdminUser: User = {
  id: 'admin-uuid',
  code: 99,
  email: 'admin@test.com',
  fullName: 'Admin User',
  passwordHash: 'hash',
  role: UserRole.ADMIN,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockDoctorUser: User = {
  id: DOCTOR_ID,
  code: 2,
  email: 'doctor@test.com',
  fullName: 'Dra. García',
  passwordHash: 'hash',
  role: UserRole.DOCTOR,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPatientUser: User = {
  id: PATIENT_ID,
  code: 1,
  email: 'patient@test.com',
  fullName: 'Carlos López',
  passwordHash: 'hash',
  role: UserRole.PATIENT,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockOtherDoctor: User = {
  id: 'other-doctor-uuid',
  code: 3,
  email: 'other@test.com',
  fullName: 'Dr. Otro',
  passwordHash: 'hash',
  role: UserRole.DOCTOR,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockAppointment: Partial<Appointment> = {
  id: APPOINTMENT_ID,
  code: 1,
  patientId: PATIENT_ID,
  doctorId: DOCTOR_ID,
  status: AppointmentStatus.SCHEDULED,
  studyType: null,
};

const mockResult: StudyResult = {
  id: RESULT_ID,
  appointmentId: APPOINTMENT_ID,
  patientId: PATIENT_ID,
  doctorId: DOCTOR_ID,
  findings: 'Hallazgos dentro de parámetros normales',
  conclusion: null,
  appointment: mockAppointment as Appointment,
  patient: { code: 1 } as User,
  doctor: { code: 2 } as User,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const DEFAULT_PAGINATION = { page: 1, limit: 10 };

const resultRepo = {
  find: jest.fn(),
  findAndCount: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const appointmentRepo = {
  findOne: jest.fn(),
  update: jest.fn(),
};

const userRepo = {};

const mockActivitiesService = { createActivity: jest.fn() };

describe('StudyResultsService', () => {
  let service: StudyResultsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudyResultsService,
        { provide: getRepositoryToken(StudyResult), useValue: resultRepo },
        { provide: getRepositoryToken(Appointment), useValue: appointmentRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: ActivitiesService, useValue: mockActivitiesService },
      ],
    }).compile();

    service = module.get<StudyResultsService>(StudyResultsService);
    jest.clearAllMocks();
  });

  // ─── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    const dto = { appointmentId: APPOINTMENT_ID, findings: 'Hallazgos dentro de parámetros normales' };

    it('creates result and auto-completes a SCHEDULED appointment', async () => {
      appointmentRepo.findOne.mockResolvedValue({ ...mockAppointment, status: AppointmentStatus.SCHEDULED });
      resultRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValue(mockResult);
      resultRepo.create.mockReturnValue(mockResult);
      resultRepo.save.mockResolvedValue(mockResult);
      appointmentRepo.update.mockResolvedValue(undefined);

      const result = await service.create(dto, mockAdminUser);

      expect(result).toEqual(mockResult);
      expect(appointmentRepo.update).toHaveBeenCalledWith(APPOINTMENT_ID, {
        status: AppointmentStatus.COMPLETED,
      });
      expect(mockActivitiesService.createActivity).toHaveBeenCalled();
    });

    it('creates result without re-completing an already COMPLETED appointment', async () => {
      appointmentRepo.findOne.mockResolvedValue({ ...mockAppointment, status: AppointmentStatus.COMPLETED });
      resultRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValue(mockResult);
      resultRepo.create.mockReturnValue(mockResult);
      resultRepo.save.mockResolvedValue(mockResult);

      await service.create(dto, mockAdminUser);

      expect(appointmentRepo.update).not.toHaveBeenCalled();
    });

    it('allows the owning doctor to create a result', async () => {
      appointmentRepo.findOne.mockResolvedValue({ ...mockAppointment });
      resultRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValue(mockResult);
      resultRepo.create.mockReturnValue(mockResult);
      resultRepo.save.mockResolvedValue(mockResult);
      appointmentRepo.update.mockResolvedValue(undefined);

      const result = await service.create(dto, mockDoctorUser);

      expect(result).toEqual(mockResult);
    });

    it('throws ForbiddenException when doctor emits result for another doctor\'s appointment', async () => {
      appointmentRepo.findOne.mockResolvedValue({ ...mockAppointment });

      await expect(service.create(dto, mockOtherDoctor)).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when appointment does not exist', async () => {
      appointmentRepo.findOne.mockResolvedValue(null);

      await expect(service.create(dto, mockAdminUser)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException for a CANCELLED appointment', async () => {
      appointmentRepo.findOne.mockResolvedValue({ ...mockAppointment, status: AppointmentStatus.CANCELLED });

      await expect(service.create(dto, mockAdminUser)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when result already exists for the appointment', async () => {
      appointmentRepo.findOne.mockResolvedValue({ ...mockAppointment, status: AppointmentStatus.SCHEDULED });
      resultRepo.findOne.mockResolvedValue(mockResult);

      await expect(service.create(dto, mockAdminUser)).rejects.toThrow(BadRequestException);
    });
  });

  // ─── findAll ─────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('admin sees all results when no filters are given', async () => {
      resultRepo.findAndCount.mockResolvedValue([[mockResult], 1]);

      const response = await service.findAll(mockAdminUser, DEFAULT_PAGINATION);

      expect(response.data).toEqual([mockResult]);
      expect(response.total).toBe(1);
      expect(resultRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });

    it('admin can filter by doctorId', async () => {
      resultRepo.findAndCount.mockResolvedValue([[mockResult], 1]);

      await service.findAll(mockAdminUser, DEFAULT_PAGINATION, undefined, DOCTOR_ID);

      expect(resultRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { doctorId: DOCTOR_ID } }),
      );
    });

    it('doctor only sees their own results (doctorId auto-forced)', async () => {
      resultRepo.findAndCount.mockResolvedValue([[mockResult], 1]);

      await service.findAll(mockDoctorUser, DEFAULT_PAGINATION);

      expect(resultRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { doctorId: DOCTOR_ID } }),
      );
    });

    it('patient only sees their own results (patientId auto-forced)', async () => {
      resultRepo.findAndCount.mockResolvedValue([[mockResult], 1]);

      await service.findAll(mockPatientUser, DEFAULT_PAGINATION);

      expect(resultRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { patientId: PATIENT_ID } }),
      );
    });

    it('patient cannot override their own patientId via query param', async () => {
      resultRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(mockPatientUser, DEFAULT_PAGINATION, 'other-patient-uuid');

      const call = resultRepo.findAndCount.mock.calls[0][0];
      expect(call.where.patientId).toBe(PATIENT_ID);
    });

    it('admin applies combined filters', async () => {
      resultRepo.findAndCount.mockResolvedValue([[mockResult], 1]);

      await service.findAll(mockAdminUser, DEFAULT_PAGINATION, PATIENT_ID, DOCTOR_ID, APPOINTMENT_ID);

      expect(resultRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { patientId: PATIENT_ID, doctorId: DOCTOR_ID, appointmentId: APPOINTMENT_ID },
        }),
      );
    });
  });

  // ─── findOne ─────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns the result when found (no currentUser — internal use)', async () => {
      resultRepo.findOne.mockResolvedValue(mockResult);

      const result = await service.findOne(RESULT_ID);

      expect(result).toEqual(mockResult);
    });

    it('throws NotFoundException when result does not exist', async () => {
      resultRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('admin can access any result', async () => {
      resultRepo.findOne.mockResolvedValue(mockResult);

      await expect(service.findOne(RESULT_ID, mockAdminUser)).resolves.toEqual(mockResult);
    });

    it('patient can access their own result', async () => {
      resultRepo.findOne.mockResolvedValue(mockResult);

      await expect(service.findOne(RESULT_ID, mockPatientUser)).resolves.toEqual(mockResult);
    });

    it('throws ForbiddenException when patient accesses another patient result', async () => {
      const otherPatientResult = { ...mockResult, patientId: 'other-patient-uuid' };
      resultRepo.findOne.mockResolvedValue(otherPatientResult);

      await expect(service.findOne(RESULT_ID, mockPatientUser)).rejects.toThrow(ForbiddenException);
    });

    it('doctor can access their own result', async () => {
      resultRepo.findOne.mockResolvedValue(mockResult);

      await expect(service.findOne(RESULT_ID, mockDoctorUser)).resolves.toEqual(mockResult);
    });

    it('throws ForbiddenException when doctor accesses another doctor result', async () => {
      resultRepo.findOne.mockResolvedValue(mockResult);

      await expect(service.findOne(RESULT_ID, mockOtherDoctor)).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── findByAppointment ───────────────────────────────────────────────────────

  describe('findByAppointment', () => {
    it('admin sees all results for the appointment', async () => {
      resultRepo.find.mockResolvedValue([mockResult]);

      const results = await service.findByAppointment(APPOINTMENT_ID, mockAdminUser);

      expect(results).toEqual([mockResult]);
      expect(resultRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { appointmentId: APPOINTMENT_ID } }),
      );
    });

    it('doctor only sees results where they are the doctor', async () => {
      resultRepo.find.mockResolvedValue([mockResult]);

      await service.findByAppointment(APPOINTMENT_ID, mockDoctorUser);

      expect(resultRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { appointmentId: APPOINTMENT_ID, doctorId: DOCTOR_ID },
        }),
      );
    });

    it('patient only sees results where they are the patient', async () => {
      resultRepo.find.mockResolvedValue([mockResult]);

      await service.findByAppointment(APPOINTMENT_ID, mockPatientUser);

      expect(resultRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { appointmentId: APPOINTMENT_ID, patientId: PATIENT_ID },
        }),
      );
    });

    it('returns empty array when patient queries an appointment that is not theirs', async () => {
      resultRepo.find.mockResolvedValue([]);

      const results = await service.findByAppointment('other-appt-uuid', mockPatientUser);

      expect(results).toEqual([]);
      expect(resultRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { appointmentId: 'other-appt-uuid', patientId: PATIENT_ID },
        }),
      );
    });
  });

  // ─── update ──────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('admin updates findings and returns the modified result', async () => {
      const updated = { ...mockResult, findings: 'Nuevos hallazgos actualizados' };
      resultRepo.findOne
        .mockResolvedValueOnce({ ...mockResult })
        .mockResolvedValue(updated);
      resultRepo.save.mockImplementation((r) => Promise.resolve(r));

      const result = await service.update(RESULT_ID, { findings: 'Nuevos hallazgos actualizados' }, mockAdminUser);

      expect(result.findings).toBe('Nuevos hallazgos actualizados');
      expect(mockActivitiesService.createActivity).toHaveBeenCalled();
    });

    it('owning doctor can update their result', async () => {
      const updated = { ...mockResult, findings: 'Actualizado por el doctor' };
      resultRepo.findOne
        .mockResolvedValueOnce({ ...mockResult })
        .mockResolvedValue(updated);
      resultRepo.save.mockImplementation((r) => Promise.resolve(r));

      const result = await service.update(RESULT_ID, { findings: 'Actualizado por el doctor' }, mockDoctorUser);

      expect(result.findings).toBe('Actualizado por el doctor');
    });

    it('throws ForbiddenException when another doctor tries to update the result', async () => {
      resultRepo.findOne.mockResolvedValue({ ...mockResult });

      await expect(
        service.update(RESULT_ID, { findings: 'Intento' }, mockOtherDoctor),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when result does not exist', async () => {
      resultRepo.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent', { findings: 'Algo' }, mockAdminUser))
        .rejects.toThrow(NotFoundException);
    });
  });
});
