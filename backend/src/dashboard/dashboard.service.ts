import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';

export interface DashboardStats {
  totalPatients: number;
  totalDoctors: number;
  totalAppointments: number;
  pendingResults: number;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async getStats(): Promise<DashboardStats> {
    const [totalPatients, totalDoctors] = await Promise.all([
      this.userRepo.count({ where: { role: UserRole.PATIENT } }),
      this.userRepo.count({ where: { role: UserRole.DOCTOR } }),
    ]);

    return {
      totalPatients,
      totalDoctors,
      // Extended when Appointment and StudyResult modules are added
      totalAppointments: 0,
      pendingResults: 0,
    };
  }
}
