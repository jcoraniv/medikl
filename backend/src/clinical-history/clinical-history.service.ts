import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../appointments/entities/appointment.entity';
import { StudyResult } from '../study-results/entities/study-result.entity';
import { User, UserRole } from '../users/entities/user.entity';

export interface ClinicalHistoryResult {
  id: string;
  findings: string;
  conclusion: string | null;
  createdAt: Date;
}

export interface ClinicalHistoryAppointment {
  id: string;
  code: number;
  scheduledDate: Date;
  duration: number;
  status: string;
  reason: string | null;
  notes: string | null;
  doctor: { id: string; fullName: string };
  studyType: { id: string; name: string } | null;
  studyResult: ClinicalHistoryResult | null;
}

export interface ClinicalHistory {
  patient: { id: string; code: number; fullName: string; email: string };
  appointments: ClinicalHistoryAppointment[];
}

@Injectable()
export class ClinicalHistoryService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(StudyResult)
    private readonly resultRepo: Repository<StudyResult>,
  ) {}

  async findByPatientCode(code: number, currentUser: User): Promise<ClinicalHistory> {
    if (currentUser.role === UserRole.PATIENT) {
      throw new ForbiddenException('Patients cannot access clinical history');
    }

    const patient = await this.userRepo.findOne({
      where: { code, role: UserRole.PATIENT },
    });
    if (!patient) throw new NotFoundException(`Patient with code ${code} not found`);

    const appointments = await this.appointmentRepo.find({
      where: { patientId: patient.id },
      relations: ['doctor', 'studyType'],
      order: { scheduledDate: 'DESC' },
    });

    const results = await this.resultRepo.find({
      where: { patientId: patient.id },
    });
    const resultMap = new Map(results.map((r) => [r.appointmentId, r]));

    return {
      patient: {
        id: patient.id,
        code: patient.code,
        fullName: patient.fullName,
        email: patient.email,
      },
      appointments: appointments.map((appt) => {
        const result = resultMap.get(appt.id) ?? null;
        return {
          id: appt.id,
          code: appt.code,
          scheduledDate: appt.scheduledDate,
          duration: appt.duration,
          status: appt.status,
          reason: appt.reason,
          notes: appt.notes,
          doctor: { id: appt.doctor.id, fullName: appt.doctor.fullName },
          studyType: appt.studyType
            ? { id: appt.studyType.id, name: appt.studyType.name }
            : null,
          studyResult: result
            ? {
                id: result.id,
                findings: result.findings,
                conclusion: result.conclusion,
                createdAt: result.createdAt,
              }
            : null,
        };
      }),
    };
  }
}
