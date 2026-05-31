import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { paginate, PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { CreatePatientDto } from './dto/create-patient.dto';
import { CreateUserByAdminDto } from './dto/create-user-by-admin.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { BCRYPT_ROUNDS } from '../common/constants/app.constants';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = this.userRepo.create({ ...dto, passwordHash });
    return this.userRepo.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  findByRole(role: UserRole): Promise<User[]> {
    return this.userRepo.find({ where: { role } });
  }

  async createUser(dto: CreateUserByAdminDto): Promise<User> {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = this.userRepo.create({
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone ?? null,
      passwordHash,
      role: dto.role ?? UserRole.PATIENT,
    });
    try {
      return await this.userRepo.save(user);
    } catch (err: any) {
      if (err.code === '23505') throw new ConflictException('Email already in use');
      throw err;
    }
  }

  async findUsers(pagination: PaginationQueryDto): Promise<PaginatedResponse<User>> {
    const { page, limit } = pagination;
    const [data, total] = await this.userRepo.findAndCount({
      order: { code: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return paginate(data, total, page, limit);
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    Object.assign(user, dto);
    try {
      return await this.userRepo.save(user);
    } catch (err: any) {
      if (err.code === '23505') throw new ConflictException('Email already in use');
      throw err;
    }
  }

  async createPatient(dto: CreatePatientDto): Promise<User> {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = this.userRepo.create({
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone ?? null,
      passwordHash,
      role: UserRole.PATIENT,
    });
    try {
      return await this.userRepo.save(user);
    } catch (err: any) {
      if (err.code === '23505') {
        throw new ConflictException('A patient with that email already exists');
      }
      throw err;
    }
  }

  async findPatients(pagination: PaginationQueryDto): Promise<PaginatedResponse<User>> {
    const { page, limit } = pagination;
    const [data, total] = await this.userRepo.findAndCount({
      where: { role: UserRole.PATIENT },
      order: { code: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return paginate(data, total, page, limit);
  }

  async findPatientById(id: string): Promise<User> {
    const patient = await this.userRepo.findOne({ where: { id, role: UserRole.PATIENT } });
    if (!patient) throw new NotFoundException(`Patient ${id} not found`);
    return patient;
  }

  async updatePatient(id: string, dto: UpdatePatientDto): Promise<User> {
    const patient = await this.findPatientById(id);
    Object.assign(patient, dto);
    try {
      return await this.userRepo.save(patient);
    } catch (err: any) {
      if (err.code === '23505') {
        throw new ConflictException('A patient with that email already exists');
      }
      throw err;
    }
  }

  async softDeletePatient(id: string): Promise<void> {
    await this.findPatientById(id);
    await this.userRepo.softDelete(id);
  }
}
