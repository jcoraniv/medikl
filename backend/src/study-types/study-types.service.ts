import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudyType } from './entities/study-type.entity';

@Injectable()
export class StudyTypesService {
  constructor(
    @InjectRepository(StudyType)
    private readonly repo: Repository<StudyType>,
  ) {}

  findAll(): Promise<StudyType[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }
}
