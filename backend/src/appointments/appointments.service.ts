import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivitiesService } from '../activities/activities.service';
import { ActivityType } from '../activities/entities/activity.entity';
import { User } from '../users/entities/user.entity';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly activitiesService: ActivitiesService,
  ) {}

  async create(dto: CreateAppointmentDto): Promise<Appointment> {
    const patient = await this.userRepo.findOne({ where: { id: dto.patientId } });
    if (!patient) throw new NotFoundException(`Patient ${dto.patientId} not found`);

    const doctor = await this.userRepo.findOne({ where: { id: dto.doctorId } });
    if (!doctor) throw new NotFoundException(`Doctor ${dto.doctorId} not found`);

    const appointment = await this.appointmentRepo.save(
      this.appointmentRepo.create({
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        studyTypeId: dto.studyTypeId ?? null,
        scheduledDate: new Date(dto.scheduledDate),
        duration: dto.duration,
        reason: dto.reason ?? null,
        notes: dto.notes ?? null,
      }),
    );

    const full = await this.findOne(appointment.id);
    this.activitiesService.createActivity({
      type: ActivityType.APPOINTMENT_SCHEDULED,
      patientId: patient.id,
      entityId: appointment.id,
      entityType: 'Appointment',
      snapshot: this.buildSnapshot(full),
    });

    return full;
  }

  findAll(patientId?: string, doctorId?: string, status?: AppointmentStatus): Promise<Appointment[]> {
    const where: Record<string, unknown> = {};
    if (patientId) where.patientId = patientId;
    if (doctorId) where.doctorId = doctorId;
    if (status) where.status = status;

    return this.appointmentRepo.find({
      where,
      relations: ['patient', 'doctor', 'studyType'],
      order: { scheduledDate: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Appointment> {
    const appointment = await this.appointmentRepo.findOne({
      where: { id },
      relations: ['patient', 'doctor', 'studyType'],
    });
    if (!appointment) throw new NotFoundException(`Appointment ${id} not found`);
    return appointment;
  }

  async update(id: string, dto: UpdateAppointmentDto): Promise<Appointment> {
    const before = await this.findOne(id);

    if (before.status !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestException('Only scheduled appointments can be updated');
    }

    if (dto.scheduledDate) {
      (before as any).scheduledDate = new Date(dto.scheduledDate);
      delete (dto as any).scheduledDate;
    }

    const delta = this.buildDelta(before, dto);
    Object.assign(before, dto);
    const saved = await this.appointmentRepo.save(before);
    const full  = await this.findOne(saved.id);

    this.activitiesService.createActivity({
      type: ActivityType.APPOINTMENT_UPDATED,
      patientId: full.patientId,
      entityId: full.id,
      entityType: 'Appointment',
      snapshot: this.buildSnapshot(full),
      delta,
    });

    return full;
  }

  async cancel(id: string): Promise<Appointment> {
    const appointment = await this.findOne(id);

    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestException('Only scheduled appointments can be cancelled');
    }

    appointment.status = AppointmentStatus.CANCELLED;
    await this.appointmentRepo.save(appointment);
    const full = await this.findOne(id);

    this.activitiesService.createActivity({
      type: ActivityType.APPOINTMENT_CANCELLED,
      patientId: full.patientId,
      entityId: full.id,
      entityType: 'Appointment',
      snapshot: this.buildSnapshot(full),
    });

    return full;
  }

  async complete(id: string): Promise<Appointment> {
    const appointment = await this.findOne(id);

    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestException('Only scheduled appointments can be completed');
    }

    appointment.status = AppointmentStatus.COMPLETED;
    await this.appointmentRepo.save(appointment);
    const full = await this.findOne(id);

    this.activitiesService.createActivity({
      type: ActivityType.APPOINTMENT_COMPLETED,
      patientId: full.patientId,
      entityId: full.id,
      entityType: 'Appointment',
      snapshot: this.buildSnapshot(full),
    });

    return full;
  }

  private buildSnapshot(a: Appointment): Record<string, unknown> {
    return {
      id: a.id,
      code: a.code,
      status: a.status,
      scheduledDate: a.scheduledDate,
      duration: a.duration,
      reason: a.reason,
      notes: a.notes,
      patient: { id: a.patient?.id, fullName: a.patient?.fullName, code: a.patient?.code },
      doctor:  { id: a.doctor?.id,  fullName: a.doctor?.fullName  },
      studyType: a.studyType ? { id: a.studyType.id, name: a.studyType.name } : null,
    };
  }

  private buildDelta(
    before: Appointment,
    dto: UpdateAppointmentDto,
  ): Record<string, { before: unknown; after: unknown }> {
    const delta: Record<string, { before: unknown; after: unknown }> = {};
    for (const [key, after] of Object.entries(dto)) {
      const bef = (before as any)[key];
      if (bef !== after) delta[key] = { before: bef, after };
    }
    return delta;
  }
}
