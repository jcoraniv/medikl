import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { paginate, PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateStudyTypeDto } from './dto/create-study-type.dto';
import { UpdateStudyTypeDto } from './dto/update-study-type.dto';
import { StudyType } from './entities/study-type.entity';

@Injectable()
export class StudyTypesService {
  constructor(
    @InjectRepository(StudyType)
    private readonly repo: Repository<StudyType>,
  ) {}

  async findAll(pagination: PaginationQueryDto): Promise<PaginatedResponse<StudyType>> {
    const { page, limit } = pagination;
    const [data, total] = await this.repo.findAndCount({
      order: { name: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return paginate(data, total, page, limit);
  }

  async findOne(id: string): Promise<StudyType> {
    const st = await this.repo.findOne({ where: { id } });
    if (!st) throw new NotFoundException(`Study type ${id} not found`);
    return st;
  }

  async create(dto: CreateStudyTypeDto, currentUser: User): Promise<StudyType> {
    const existing = await this.repo.findOne({ where: { name: dto.name } });
    if (existing) throw new ConflictException(`Study type "${dto.name}" already exists`);
    return this.repo.save(this.repo.create({ ...dto, createdById: currentUser.id }));
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

  async remove(id: string, currentUser: User): Promise<void> {
    const st = await this.findOne(id);

    if (currentUser.role === UserRole.DOCTOR && st.createdById !== currentUser.id) {
      throw new ForbiddenException('You can only delete study types you created');
    }

    await this.repo.softDelete(id);
  }
}
