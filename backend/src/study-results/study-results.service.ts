import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivitiesService } from '../activities/activities.service';
import { ActivityType } from '../activities/entities/activity.entity';
import { Appointment, AppointmentStatus } from '../appointments/entities/appointment.entity';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { paginate, PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateStudyResultDto } from './dto/create-study-result.dto';
import { UpdateStudyResultDto } from './dto/update-study-result.dto';
import { StudyResult } from './entities/study-result.entity';

@Injectable()
export class StudyResultsService {
  constructor(
    @InjectRepository(StudyResult)
    private readonly resultRepo: Repository<StudyResult>,
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly activitiesService: ActivitiesService,
  ) {}

  async create(dto: CreateStudyResultDto, currentUser: User): Promise<StudyResult> {
    const appointment = await this.appointmentRepo.findOne({
      where: { id: dto.appointmentId },
      relations: ['studyType'],
    });
    if (!appointment) throw new NotFoundException(`Appointment ${dto.appointmentId} not found`);
    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Cannot add results to a cancelled appointment');
    }

    // Doctors can only emit results for their own appointments
    if (currentUser.role === UserRole.DOCTOR && appointment.doctorId !== currentUser.id) {
      throw new ForbiddenException('You can only emit results for your own appointments');
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
      }),
    );

    if (appointment.status === AppointmentStatus.SCHEDULED) {
      await this.appointmentRepo.update(appointment.id, { status: AppointmentStatus.COMPLETED });
    }

    const fullResult = await this.findOne(result.id);
    this.activitiesService.createActivity({
      type: ActivityType.RESULT_CREATED,
      patientId: appointment.patientId,
      entityId: result.id,
      entityType: 'StudyResult',
      snapshot: this.buildSnapshot(fullResult),
    });

    return fullResult;
  }

  async findAll(
    currentUser: User,
    pagination: PaginationQueryDto,
    patientId?: string,
    doctorId?: string,
    appointmentId?: string,
  ): Promise<PaginatedResponse<StudyResult>> {
    const { page, limit } = pagination;
    const where: Record<string, string> = {};
    if (patientId) where.patientId = patientId;
    if (appointmentId) where.appointmentId = appointmentId;

    if (currentUser.role === UserRole.DOCTOR) {
      where.doctorId = currentUser.id;
    } else if (doctorId) {
      where.doctorId = doctorId;
    }

    const [data, total] = await this.resultRepo.findAndCount({
      where,
      relations: ['patient', 'doctor', 'appointment', 'appointment.studyType'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return paginate(data, total, page, limit);
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

  async update(id: string, dto: UpdateStudyResultDto, currentUser: User): Promise<StudyResult> {
    const result = await this.findOne(id);

    if (currentUser.role === UserRole.DOCTOR && result.doctorId !== currentUser.id) {
      throw new ForbiddenException('You can only update your own study results');
    }

    Object.assign(result, dto);
    const saved = await this.resultRepo.save(result);
    const full  = await this.findOne(saved.id);

    this.activitiesService.createActivity({
      type: ActivityType.RESULT_UPDATED,
      patientId: full.patientId,
      entityId: full.id,
      entityType: 'StudyResult',
      snapshot: this.buildSnapshot(full),
    });

    return full;
  }

  private buildSnapshot(r: StudyResult): Record<string, unknown> {
    return {
      id: r.id,
      findings: r.findings,
      conclusion: r.conclusion,
      patient: { id: r.patient?.id, fullName: r.patient?.fullName, code: r.patient?.code },
      doctor:  { id: r.doctor?.id,  fullName: r.doctor?.fullName  },
      appointment: r.appointment ? { id: r.appointment.id, code: r.appointment.code } : null,
    };
  }
}
