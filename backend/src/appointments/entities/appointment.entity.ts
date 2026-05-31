import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { StudyType } from '../../study-types/entities/study-type.entity';

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('appointments')
export class Appointment extends BaseEntity {
  @ManyToOne(() => User)
  patient: User;

  @Column()
  patientId: string;

  @ManyToOne(() => User)
  doctor: User;

  @Column()
  doctorId: string;

  @ManyToOne(() => StudyType, { nullable: true, eager: false })
  studyType: StudyType | null;

  @Column({ nullable: true })
  studyTypeId: string | null;

  @Column({ type: 'timestamp' })
  scheduledDate: Date;

  @Column({ type: 'int' })
  duration: number;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'enum', enum: AppointmentStatus, default: AppointmentStatus.SCHEDULED })
  status: AppointmentStatus;
}
