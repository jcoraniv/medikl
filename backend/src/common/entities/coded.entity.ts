import { BaseEntity } from './base.entity';

// Abstract marker: entities with a sequential code field.
// Each concrete entity must declare @Column for 'code' with its own sequence default.
export abstract class CodedEntity extends BaseEntity {
  code: number;
}
