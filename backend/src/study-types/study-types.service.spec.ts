import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StudyTypesService } from './study-types.service';
import { StudyType } from './entities/study-type.entity';

const mockStudyType: StudyType = {
  id: 'st-uuid',
  name: 'Ecografía abdominal',
  description: 'Examen abdominal',
  duration: 30,
  address: 'Clínica del Valle',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
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
    it('returns all study types ordered by name', async () => {
      mockRepo.find.mockResolvedValue([mockStudyType]);
      const result = await service.findAll();
      expect(result).toEqual([mockStudyType]);
      expect(mockRepo.find).toHaveBeenCalledWith({ order: { name: 'ASC' } });
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
    it('creates and returns a new study type', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.create.mockReturnValue(mockStudyType);
      mockRepo.save.mockResolvedValue(mockStudyType);

      const result = await service.create({ name: 'Ecografía abdominal', duration: 30 });

      expect(result).toEqual(mockStudyType);
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it('throws ConflictException when name already exists', async () => {
      mockRepo.findOne.mockResolvedValue(mockStudyType);

      await expect(service.create({ name: 'Ecografía abdominal', duration: 30 }))
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
    it('removes the study type', async () => {
      mockRepo.findOne.mockResolvedValue(mockStudyType);
      mockRepo.remove.mockResolvedValue(undefined);

      await expect(service.remove('st-uuid')).resolves.toBeUndefined();
      expect(mockRepo.remove).toHaveBeenCalledWith(mockStudyType);
    });

    it('throws NotFoundException when study type does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
    });
  });
});
