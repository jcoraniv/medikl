import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from './entities/user.entity';
import { UsersService } from './users.service';

const PATIENT_ID = 'patient-uuid';

const mockPatient: User = {
  id: PATIENT_ID,
  code: 1,
  fullName: 'Carlos López',
  email: 'carlos@test.com',
  passwordHash: 'hash',
  role: UserRole.PATIENT,
  phone: null,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const DEFAULT_PAGINATION = { page: 1, limit: 10 };

describe('UsersService — patient management', () => {
  let service: UsersService;
  let userRepo: {
    findOne: jest.Mock;
    findAndCount: jest.Mock;
    save: jest.Mock;
    softDelete: jest.Mock;
    create: jest.Mock;
  };

  beforeEach(async () => {
    userRepo = {
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
      create: jest.fn().mockImplementation((data) => data),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepo },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  // ─── createUser ───────────────────────────────────────────────────────────────

  describe('createUser', () => {
    it('creates a user with the specified role', async () => {
      userRepo.save.mockResolvedValue({ ...mockPatient, role: UserRole.DOCTOR });

      const result = await service.createUser({
        fullName: 'Dr. Nuevo',
        email: 'dr@test.com',
        password: 'secret123',
        role: UserRole.DOCTOR,
      });

      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: UserRole.DOCTOR }),
      );
      expect(result.role).toBe(UserRole.DOCTOR);
    });

    it('defaults to PATIENT role when role is not provided', async () => {
      userRepo.save.mockResolvedValue(mockPatient);

      await service.createUser({ fullName: 'X', email: 'x@test.com', password: 'secret123' });

      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: UserRole.PATIENT }),
      );
    });

    it('throws ConflictException when email is already in use', async () => {
      userRepo.save.mockRejectedValue({ code: '23505' });

      await expect(
        service.createUser({ fullName: 'X', email: 'dup@test.com', password: 'secret123' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ─── findUsers ────────────────────────────────────────────────────────────────

  describe('findUsers', () => {
    it('returns paginated list of all users', async () => {
      userRepo.findAndCount.mockResolvedValue([[mockPatient], 1]);

      const result = await service.findUsers(DEFAULT_PAGINATION);

      expect(result.data).toEqual([mockPatient]);
      expect(userRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ order: { code: 'ASC' } }),
      );
    });
  });

  // ─── createPatient ────────────────────────────────────────────────────────────

  describe('createPatient', () => {
    it('creates a user with PATIENT role and hashed password', async () => {
      const saved = { ...mockPatient, email: 'new@test.com' };
      userRepo.save.mockResolvedValue(saved);

      const result = await service.createPatient({
        fullName: 'Carlos López',
        email: 'new@test.com',
        password: 'secret123',
        phone: '+591 70000000',
      });

      expect(result.email).toBe('new@test.com');
      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: UserRole.PATIENT }),
      );
      expect(userRepo.save).toHaveBeenCalled();
    });

    it('throws ConflictException when email is already in use', async () => {
      userRepo.save.mockRejectedValue({ code: '23505' });

      await expect(
        service.createPatient({ fullName: 'X', email: 'dup@test.com', password: 'secret123' }),
      ).rejects.toThrow(ConflictException);
    });

    it('sets phone to null when not provided', async () => {
      userRepo.save.mockResolvedValue(mockPatient);

      await service.createPatient({
        fullName: 'Carlos López',
        email: 'new@test.com',
        password: 'secret123',
      });

      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ phone: null }),
      );
    });
  });

  // ─── findPatients ─────────────────────────────────────────────────────────────

  describe('findPatients', () => {
    it('returns paginated patient list ordered by code ASC', async () => {
      userRepo.findAndCount.mockResolvedValue([[mockPatient], 1]);

      const result = await service.findPatients(DEFAULT_PAGINATION);

      expect(result.data).toEqual([mockPatient]);
      expect(result.total).toBe(1);
      expect(userRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { role: UserRole.PATIENT },
          order: { code: 'ASC' },
        }),
      );
    });

    it('applies correct skip/take for pagination', async () => {
      userRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findPatients({ page: 3, limit: 5 });

      expect(userRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 5 }),
      );
    });
  });

  // ─── findPatientById ──────────────────────────────────────────────────────────

  describe('findPatientById', () => {
    it('returns the patient when found', async () => {
      userRepo.findOne.mockResolvedValue(mockPatient);

      const result = await service.findPatientById(PATIENT_ID);

      expect(result).toEqual(mockPatient);
      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { id: PATIENT_ID, role: UserRole.PATIENT },
      });
    });

    it('throws NotFoundException when patient does not exist', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.findPatientById('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── updatePatient ────────────────────────────────────────────────────────────

  describe('updatePatient', () => {
    it('updates fullName and email and returns the saved patient', async () => {
      const updated = { ...mockPatient, fullName: 'Carlos M. López', email: 'new@test.com' };
      userRepo.findOne.mockResolvedValue({ ...mockPatient });
      userRepo.save.mockResolvedValue(updated);

      const result = await service.updatePatient(PATIENT_ID, {
        fullName: 'Carlos M. López',
        email: 'new@test.com',
      });

      expect(result.fullName).toBe('Carlos M. López');
      expect(result.email).toBe('new@test.com');
      expect(userRepo.save).toHaveBeenCalled();
    });

    it('updates phone and returns the saved patient', async () => {
      const updated = { ...mockPatient, phone: '+591 70000000' };
      userRepo.findOne.mockResolvedValue({ ...mockPatient });
      userRepo.save.mockResolvedValue(updated);

      const result = await service.updatePatient(PATIENT_ID, { phone: '+591 70000000' });

      expect(result.phone).toBe('+591 70000000');
    });

    it('throws NotFoundException when patient does not exist', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updatePatient('unknown', { fullName: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when updating to an already used email', async () => {
      userRepo.findOne.mockResolvedValue({ ...mockPatient });
      userRepo.save.mockRejectedValue({ code: '23505' });

      await expect(
        service.updatePatient(PATIENT_ID, { email: 'dup@test.com' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ─── softDeletePatient ────────────────────────────────────────────────────────

  describe('softDeletePatient', () => {
    it('calls softDelete with the patient id', async () => {
      userRepo.findOne.mockResolvedValue(mockPatient);
      userRepo.softDelete.mockResolvedValue({ affected: 1 });

      await service.softDeletePatient(PATIENT_ID);

      expect(userRepo.softDelete).toHaveBeenCalledWith(PATIENT_ID);
    });

    it('throws NotFoundException when patient does not exist', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.softDeletePatient('unknown')).rejects.toThrow(NotFoundException);
      expect(userRepo.softDelete).not.toHaveBeenCalled();
    });
  });
});
