import { Exclude } from 'class-transformer';
import { Column, Entity } from 'typeorm';
import { CodedEntity } from '../../common/entities/coded.entity';

export enum UserRole {
  ADMIN = 'admin',
  DOCTOR = 'doctor',
  PATIENT = 'patient',
}

@Entity('users')
export class User extends CodedEntity {
  @Column({ unique: true })
  email: string;

  @Exclude()
  @Column()
  passwordHash: string;

  @Column()
  fullName: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.PATIENT })
  role: UserRole;
}
