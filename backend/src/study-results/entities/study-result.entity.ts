import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';

@Entity('study_results')
export class StudyResult extends BaseEntity {
  @ManyToOne(() => Appointment, { eager: false })
  appointment: Appointment;

  @Column()
  appointmentId: string;

  @ManyToOne(() => User)
  patient: User;

  @Column()
  patientId: string;

  @ManyToOne(() => User)
  doctor: User;

  @Column()
  doctorId: string;

  @Column({ type: 'text' })
  findings: string;

  @Column({ type: 'text', nullable: true })
  conclusion: string | null;
}
