import { DataSource, EntitySubscriberInterface, EventSubscriber, InsertEvent } from 'typeorm';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { User } from '../../users/entities/user.entity';

const SEQUENCE_MAP = new Map<Function, string>([
  [User, 'users_code_seq'],
  [Appointment, 'appointments_code_seq'],
]);

@EventSubscriber()
export class CodeSubscriber implements EntitySubscriberInterface {
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  async beforeInsert(event: InsertEvent<User | Appointment>): Promise<void> {
    const seqName = SEQUENCE_MAP.get(event.metadata.target as Function);
    if (!seqName || event.entity.code) return;

    const [{ nextval }] = await event.manager.query(`SELECT nextval('${seqName}')`);
    event.entity.code = Number(nextval);
  }
}
