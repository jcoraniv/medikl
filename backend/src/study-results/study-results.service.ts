import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from '../appointments/entities/appointment.entity';
import { User } from '../users/entities/user.entity';
import { CreateStudyResultDto } from './dto/create-study-result.dto';
import { UpdateStudyResultDto } from './dto/update-study-result.dto';
import { StudyResult, StudyResultStatus } from './entities/study-result.entity';

@Injectable()
export class StudyResultsService {
  constructor(
    @InjectRepository(StudyResult)
    private readonly resultRepo: Repository<StudyResult>,
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(dto: CreateStudyResultDto): Promise<StudyResult> {
    const appointment = await this.appointmentRepo.findOne({
      where: { id: dto.appointmentId },
      relations: ['studyType'],
    });
    if (!appointment) throw new NotFoundException(`Appointment ${dto.appointmentId} not found`);
    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Cannot add results to a cancelled appointment');
    }

    const existing = await this.resultRepo.findOne({ where: { appointmentId: dto.appointmentId } });
    if (existing) throw new BadRequestException('This appointment already has a study result');

    const result = await this.resultRepo.save(
      this.resultRepo.create({
        appointmentId: dto.appointmentId,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        findings: dto.findings,
        conclusion: dto.conclusion ?? null,
        status: StudyResultStatus.PENDING,
      }),
    );

    if (appointment.status === AppointmentStatus.SCHEDULED) {
      await this.appointmentRepo.update(appointment.id, { status: AppointmentStatus.COMPLETED });
    }

    return result;
  }

  findAll(patientId?: string, doctorId?: string, appointmentId?: string): Promise<StudyResult[]> {
    const where: Record<string, string> = {};
    if (patientId) where.patientId = patientId;
    if (doctorId) where.doctorId = doctorId;
    if (appointmentId) where.appointmentId = appointmentId;

    return this.resultRepo.find({
      where,
      relations: ['patient', 'doctor', 'appointment', 'appointment.studyType'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<StudyResult> {
    const result = await this.resultRepo.findOne({
      where: { id },
      relations: ['patient', 'doctor', 'appointment', 'appointment.studyType'],
    });
    if (!result) throw new NotFoundException(`StudyResult ${id} not found`);
    return result;
  }

  findByAppointment(appointmentId: string): Promise<StudyResult[]> {
    return this.resultRepo.find({
      where: { appointmentId },
      relations: ['patient', 'doctor', 'appointment', 'appointment.studyType'],
    });
  }

  async update(id: string, dto: UpdateStudyResultDto): Promise<StudyResult> {
    const result = await this.findOne(id);
    if (result.status === StudyResultStatus.REVIEWED) {
      throw new BadRequestException('A reviewed result cannot be modified');
    }
    Object.assign(result, dto);
    return this.resultRepo.save(result);
  }

  async review(id: string): Promise<StudyResult> {
    const result = await this.findOne(id);
    if (result.status === StudyResultStatus.REVIEWED) {
      throw new BadRequestException('Result is already reviewed');
    }
    result.status = StudyResultStatus.REVIEWED;
    result.reviewedAt = new Date();
    return this.resultRepo.save(result);
  }
}
