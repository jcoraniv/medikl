import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from '../appointments/entities/appointment.entity';
import { StudyResult } from '../study-results/entities/study-result.entity';
import { User } from '../users/entities/user.entity';
import { ClinicalHistoryController } from './clinical-history.controller';
import { ClinicalHistoryService } from './clinical-history.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Appointment, StudyResult])],
  controllers: [ClinicalHistoryController],
  providers: [ClinicalHistoryService],
})
export class ClinicalHistoryModule {}
