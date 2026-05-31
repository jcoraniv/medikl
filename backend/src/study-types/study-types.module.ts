import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudyType } from './entities/study-type.entity';
import { StudyTypesController } from './study-types.controller';
import { StudyTypesService } from './study-types.service';

@Module({
  imports: [TypeOrmModule.forFeature([StudyType])],
  controllers: [StudyTypesController],
  providers: [StudyTypesService],
  exports: [StudyTypesService],
})
export class StudyTypesModule {}
