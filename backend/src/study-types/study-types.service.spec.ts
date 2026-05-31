import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { StudyType } from './entities/study-type.entity';
import { StudyTypesService } from './study-types.service';

const DOCTOR_ID = 'doctor-uuid';

const mockAdminUser: User = {
  id: 'admin-uuid',
  code: 99,
  email: 'admin@test.com',
  fullName: 'Admin User',
  passwordHash: 'hash',
  role: UserRole.ADMIN,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockDoctorUser: User = {
  id: DOCTOR_ID,
  code: 2,
  email: 'doctor@test.com',
  fullName: 'Dra. García',
  passwordHash: 'hash',
  role: UserRole.DOCTOR,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockOtherDoctor: User = {
  id: 'other-doctor-uuid',
  code: 3,
  email: 'other@test.com',
  fullName: 'Dr. Otro',
  passwordHash: 'hash',
  role: UserRole.DOCTOR,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockStudyType: StudyType = {
  id: 'st-uuid',
  name: 'Ecografía abdominal',
  description: 'Examen abdominal',
  duration: 30,
  address: 'Clínica del Valle',
  createdById: DOCTOR_ID,
  createdBy: mockDoctorUser,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const DEFAULT_PAGINATION = { page: 1, limit: 10 };

const mockRepo = {
  find: jest.fn(),
  findAndCount: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  softDelete: jest.fn(),
};

describe('StudyTypesService', () => {
  let service: StudyTypesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudyTypesService,
        { provide: getRepositoryToken(StudyType), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<StudyTypesService>(StudyTypesService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns paginated study types ordered by createdAt descending', async () => {
      mockRepo.findAndCount.mockResolvedValue([[mockStudyType], 1]);
      const response = await service.findAll(DEFAULT_PAGINATION);
      expect(response.data).toEqual([mockStudyType]);
      expect(response.total).toBe(1);
      expect(response.page).toBe(1);
      expect(mockRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ order: { createdAt: 'DESC' }, skip: 0, take: 10 }),
      );
    });
  });

  describe('findOne', () => {
    it('returns the study type when found', async () => {
      mockRepo.findOne.mockResolvedValue(mockStudyType);
      const result = await service.findOne('st-uuid');
      expect(result).toEqual(mockStudyType);
    });

    it('throws NotFoundException when not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates and stores createdById from currentUser', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.create.mockReturnValue(mockStudyType);
      mockRepo.save.mockResolvedValue(mockStudyType);

      const result = await service.create({ name: 'Ecografía abdominal', duration: 30 }, mockDoctorUser);

      expect(result).toEqual(mockStudyType);
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ createdById: DOCTOR_ID }),
      );
    });

    it('throws ConflictException when name already exists', async () => {
      mockRepo.findOne.mockResolvedValue(mockStudyType);

      await expect(service.create({ name: 'Ecografía abdominal', duration: 30 }, mockAdminUser))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('updates and returns the study type', async () => {
      mockRepo.findOne.mockResolvedValue({ ...mockStudyType });
      mockRepo.save.mockImplementation((st) => Promise.resolve(st));

      const result = await service.update('st-uuid', { duration: 45 });

      expect(result.duration).toBe(45);
    });

    it('throws ConflictException when updating to an already existing name', async () => {
      mockRepo.findOne
        .mockResolvedValueOnce(mockStudyType)
        .mockResolvedValueOnce({ id: 'other-uuid', name: 'Ecografía pélvica' });

      await expect(service.update('st-uuid', { name: 'Ecografía pélvica' }))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('admin can soft-delete any study type', async () => {
      mockRepo.findOne.mockResolvedValue(mockStudyType);
      mockRepo.softDelete.mockResolvedValue(undefined);

      await expect(service.remove('st-uuid', mockAdminUser)).resolves.toBeUndefined();
      expect(mockRepo.softDelete).toHaveBeenCalledWith('st-uuid');
    });

    it('doctor can soft-delete their own study type', async () => {
      mockRepo.findOne.mockResolvedValue(mockStudyType);
      mockRepo.softDelete.mockResolvedValue(undefined);

      await expect(service.remove('st-uuid', mockDoctorUser)).resolves.toBeUndefined();
    });

    it('throws ForbiddenException when doctor deletes another doctor\'s study type', async () => {
      mockRepo.findOne.mockResolvedValue(mockStudyType);

      await expect(service.remove('st-uuid', mockOtherDoctor)).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when study type does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.remove('bad-id', mockAdminUser)).rejects.toThrow(NotFoundException);
    });
  });
});
