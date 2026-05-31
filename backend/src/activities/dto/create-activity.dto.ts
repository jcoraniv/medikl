import { ActivityType } from '../entities/activity.entity';

export class CreateActivityDto {
  type: ActivityType;
  patientId: string;
  entityId: string;
  entityType: string;
  snapshot: Record<string, unknown>;
  delta?: Record<string, unknown> | null;
}
