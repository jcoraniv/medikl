import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export enum ActivityType {
  APPOINTMENT_SCHEDULED  = 'APPOINTMENT_SCHEDULED',
  APPOINTMENT_UPDATED    = 'APPOINTMENT_UPDATED',
  APPOINTMENT_COMPLETED  = 'APPOINTMENT_COMPLETED',
  APPOINTMENT_CANCELLED  = 'APPOINTMENT_CANCELLED',
  RESULT_CREATED         = 'RESULT_CREATED',
  RESULT_UPDATED         = 'RESULT_UPDATED',
}

@Entity('activities')
export class Activity extends BaseEntity {
  @Column({ type: 'enum', enum: ActivityType })
  type: ActivityType;

  @Column()
  patientId: string;

  @Column()
  entityId: string;

  @Column()
  entityType: string;

  @Column({ type: 'jsonb' })
  snapshot: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  delta: Record<string, unknown> | null;

  @Column({ type: 'text' })
  generatedText: string;

  @Column({ type: 'float', array: true, nullable: true })
  embedding: number[] | null;
}
