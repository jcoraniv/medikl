import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from '../appointments/entities/appointment.entity';
import { User } from '../users/entities/user.entity';
import { StudyResult } from './entities/study-result.entity';
import { StudyResultsController } from './study-results.controller';
import { StudyResultsService } from './study-results.service';

@Module({
  imports: [TypeOrmModule.forFeature([StudyResult, Appointment, User])],
  controllers: [StudyResultsController],
  providers: [StudyResultsService],
  exports: [StudyResultsService],
})
export class StudyResultsModule {}
