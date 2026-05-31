import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateStudyTypeDto } from './dto/create-study-type.dto';
import { UpdateStudyTypeDto } from './dto/update-study-type.dto';
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

  async findOne(id: string): Promise<StudyType> {
    const st = await this.repo.findOne({ where: { id } });
    if (!st) throw new NotFoundException(`Study type ${id} not found`);
    return st;
  }

  async create(dto: CreateStudyTypeDto): Promise<StudyType> {
    const existing = await this.repo.findOne({ where: { name: dto.name } });
    if (existing) throw new ConflictException(`Study type "${dto.name}" already exists`);
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: UpdateStudyTypeDto): Promise<StudyType> {
    const st = await this.findOne(id);
    if (dto.name && dto.name !== st.name) {
      const existing = await this.repo.findOne({ where: { name: dto.name } });
      if (existing) throw new ConflictException(`Study type "${dto.name}" already exists`);
    }
    Object.assign(st, dto);
    return this.repo.save(st);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repo.softDelete(id);
  }
}
