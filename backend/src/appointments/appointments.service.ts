import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  ) {}

  async create(dto: CreateAppointmentDto): Promise<Appointment> {
    const patient = await this.userRepo.findOne({ where: { id: dto.patientId } });
    if (!patient) throw new NotFoundException(`Patient ${dto.patientId} not found`);

    const doctor = await this.userRepo.findOne({ where: { id: dto.doctorId } });
    if (!doctor) throw new NotFoundException(`Doctor ${dto.doctorId} not found`);

    const appointment = this.appointmentRepo.create({
      patientId: dto.patientId,
      doctorId: dto.doctorId,
      studyTypeId: dto.studyTypeId ?? null,
      scheduledDate: new Date(dto.scheduledDate),
      duration: dto.duration,
      reason: dto.reason ?? null,
      notes: dto.notes ?? null,
    });

    return this.appointmentRepo.save(appointment);
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
    const appointment = await this.findOne(id);

    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestException('Only scheduled appointments can be updated');
    }

    if (dto.scheduledDate) {
      (appointment as any).scheduledDate = new Date(dto.scheduledDate);
      delete (dto as any).scheduledDate;
    }

    Object.assign(appointment, dto);
    return this.appointmentRepo.save(appointment);
  }

  async cancel(id: string): Promise<Appointment> {
    const appointment = await this.findOne(id);

    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestException('Only scheduled appointments can be cancelled');
    }

    appointment.status = AppointmentStatus.CANCELLED;
    return this.appointmentRepo.save(appointment);
  }

  async complete(id: string): Promise<Appointment> {
    const appointment = await this.findOne(id);

    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestException('Only scheduled appointments can be completed');
    }

    appointment.status = AppointmentStatus.COMPLETED;
    return this.appointmentRepo.save(appointment);
  }
}
