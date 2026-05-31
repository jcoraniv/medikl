import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Appointment, AppointmentStatus } from '../appointments/entities/appointment.entity';
import { StudyResult } from '../study-results/entities/study-result.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { ClinicalHistoryService } from './clinical-history.service';

const mockPatient = {
  id: 'patient-id',
  code: 1,
  fullName: 'Carlos López',
  email: 'carlos@test.com',
  role: UserRole.PATIENT,
} as User;

const mockDoctor = {
  id: 'doctor-id',
  code: 2,
  fullName: 'Dra. García',
} as User;

const mockStudyType = { id: 'st-1', name: 'Ecografía abdominal' };

const mockAppointment = {
  id: 'appt-1',
  code: 100,
  patientId: 'patient-id',
  doctorId: 'doctor-id',
  doctor: mockDoctor,
  studyType: mockStudyType,
  studyTypeId: 'st-1',
  scheduledDate: new Date('2025-01-15T10:00:00Z'),
  duration: 30,
  status: AppointmentStatus.COMPLETED,
  reason: 'Dolor abdominal',
  notes: null,
} as unknown as Appointment;

const mockResult = {
  id: 'result-1',
  appointmentId: 'appt-1',
  patientId: 'patient-id',
  doctorId: 'doctor-id',
  findings: 'Sin hallazgos patológicos',
  conclusion: 'Normal',
  createdAt: new Date('2025-01-15T12:00:00Z'),
} as StudyResult;

describe('ClinicalHistoryService', () => {
  let service: ClinicalHistoryService;
  let userRepo: { findOne: jest.Mock };
  let appointmentRepo: { find: jest.Mock };
  let resultRepo: { find: jest.Mock };

  beforeEach(async () => {
    userRepo = { findOne: jest.fn() };
    appointmentRepo = { find: jest.fn() };
    resultRepo = { find: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClinicalHistoryService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Appointment), useValue: appointmentRepo },
        { provide: getRepositoryToken(StudyResult), useValue: resultRepo },
      ],
    }).compile();

    service = module.get(ClinicalHistoryService);
  });

  describe('findByPatientCode', () => {
    it('throws NotFoundException when patient code does not exist', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.findByPatientCode(999)).rejects.toThrow(NotFoundException);
    });

    it('queries user repo with correct code and PATIENT role', async () => {
      userRepo.findOne.mockResolvedValue(mockPatient);
      appointmentRepo.find.mockResolvedValue([]);
      resultRepo.find.mockResolvedValue([]);

      await service.findByPatientCode(1);

      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { code: 1, role: UserRole.PATIENT },
      });
    });

    it('returns patient info and mapped appointments with study result', async () => {
      userRepo.findOne.mockResolvedValue(mockPatient);
      appointmentRepo.find.mockResolvedValue([mockAppointment]);
      resultRepo.find.mockResolvedValue([mockResult]);

      const history = await service.findByPatientCode(1);

      expect(history.patient.fullName).toBe('Carlos López');
      expect(history.patient.code).toBe(1);
      expect(history.appointments).toHaveLength(1);

      const appt = history.appointments[0];
      expect(appt.code).toBe(100);
      expect(appt.doctor.fullName).toBe('Dra. García');
      expect(appt.studyType?.name).toBe('Ecografía abdominal');
      expect(appt.studyResult?.findings).toBe('Sin hallazgos patológicos');
      expect(appt.studyResult?.conclusion).toBe('Normal');
    });

    it('sets studyResult to null when no result exists for appointment', async () => {
      userRepo.findOne.mockResolvedValue(mockPatient);
      appointmentRepo.find.mockResolvedValue([mockAppointment]);
      resultRepo.find.mockResolvedValue([]);

      const history = await service.findByPatientCode(1);

      expect(history.appointments[0].studyResult).toBeNull();
    });

    it('returns empty appointments array when patient has none', async () => {
      userRepo.findOne.mockResolvedValue(mockPatient);
      appointmentRepo.find.mockResolvedValue([]);
      resultRepo.find.mockResolvedValue([]);

      const history = await service.findByPatientCode(1);

      expect(history.appointments).toHaveLength(0);
    });

    it('sets studyType to null when appointment has no study type', async () => {
      const apptNoType = { ...mockAppointment, studyType: null, studyTypeId: null };
      userRepo.findOne.mockResolvedValue(mockPatient);
      appointmentRepo.find.mockResolvedValue([apptNoType]);
      resultRepo.find.mockResolvedValue([]);

      const history = await service.findByPatientCode(1);

      expect(history.appointments[0].studyType).toBeNull();
    });
  });
});
