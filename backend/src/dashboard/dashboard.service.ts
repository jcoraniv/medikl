import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { Appointment, AppointmentStatus } from '../appointments/entities/appointment.entity';

export interface DashboardStats {
  totalPatients: number;
  totalDoctors: number;
  totalAppointments: number;
  pendingResults: number;
  patientsThisWeek: number;
  cancelledAppointments: number;
}

function currentWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(now);
  start.setDate(now.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function currentYearRange(): { start: Date; end: Date } {
  const year = new Date().getFullYear();
  return {
    start: new Date(year, 0, 1, 0, 0, 0, 0),
    end: new Date(year, 11, 31, 23, 59, 59, 999),
  };
}

function currentMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
  ) {}

  async getStats(currentUser: User): Promise<DashboardStats> {
    const { start, end } = currentWeekRange();
    const { start: yearStart, end: yearEnd } = currentYearRange();
    const { start: monthStart, end: monthEnd } = currentMonthRange();

    if (currentUser.role === UserRole.PATIENT) {
      const [totalAppointments, pendingResults, cancelledAppointments] = await Promise.all([
        this.appointmentRepo.count({ where: { patientId: currentUser.id, scheduledDate: Between(monthStart, monthEnd) } }),
        this.appointmentRepo.count({ where: { patientId: currentUser.id, status: AppointmentStatus.SCHEDULED } }),
        this.appointmentRepo.count({ where: { patientId: currentUser.id, status: AppointmentStatus.CANCELLED, scheduledDate: Between(monthStart, monthEnd) } }),
      ]);
      return { totalPatients: 0, totalDoctors: 0, totalAppointments, pendingResults, patientsThisWeek: 0, cancelledAppointments };
    }

    const isDoctor = currentUser.role === UserRole.DOCTOR;

    if (isDoctor) {
      const [totalAppointments, pendingResults, patientsThisWeek, cancelledAppointments] = await Promise.all([
        this.appointmentRepo.count({ where: { doctorId: currentUser.id } }),
        this.appointmentRepo.count({ where: { doctorId: currentUser.id, status: AppointmentStatus.SCHEDULED } }),
        this.appointmentRepo.count({
          where: { doctorId: currentUser.id, status: AppointmentStatus.COMPLETED, scheduledDate: Between(start, end) },
        }),
        this.appointmentRepo.count({ where: { doctorId: currentUser.id, status: AppointmentStatus.CANCELLED, scheduledDate: Between(yearStart, yearEnd) } }),
      ]);
      return { totalPatients: 0, totalDoctors: 0, totalAppointments, pendingResults, patientsThisWeek, cancelledAppointments };
    }

    const [totalPatients, totalDoctors, totalAppointments, pendingResults, patientsThisWeek, cancelledAppointments] = await Promise.all([
      this.userRepo.count({ where: { role: UserRole.PATIENT } }),
      this.userRepo.count({ where: { role: UserRole.DOCTOR } }),
      this.appointmentRepo.count(),
      this.appointmentRepo.count({ where: { status: AppointmentStatus.SCHEDULED } }),
      this.appointmentRepo.count({ where: { status: AppointmentStatus.COMPLETED, scheduledDate: Between(start, end) } }),
      this.appointmentRepo.count({ where: { status: AppointmentStatus.CANCELLED, scheduledDate: Between(yearStart, yearEnd) } }),
    ]);

    return { totalPatients, totalDoctors, totalAppointments, pendingResults, patientsThisWeek, cancelledAppointments };
  }
}
