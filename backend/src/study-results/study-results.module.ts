import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivitiesModule } from '../activities/activities.module';
import { Appointment } from '../appointments/entities/appointment.entity';
import { User } from '../users/entities/user.entity';
import { StudyResult } from './entities/study-result.entity';
import { StudyResultsController } from './study-results.controller';
import { StudyResultsService } from './study-results.service';

@Module({
  imports: [TypeOrmModule.forFeature([StudyResult, Appointment, User]), ActivitiesModule],
  controllers: [StudyResultsController],
  providers: [StudyResultsService],
  exports: [StudyResultsService],
})
export class StudyResultsModule {}
