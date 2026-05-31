import { Column, DeleteDateColumn, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity('study_types')
export class StudyType extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'int', default: 30 })
  duration: number;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'uuid', nullable: true })
  createdById: string | null;

  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'createdById' })
  createdBy: User | null;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
