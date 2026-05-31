import { Column } from 'typeorm';
import { BaseEntity } from './base.entity';

export abstract class CodedEntity extends BaseEntity {
  @Column({ type: 'int', unique: true })
  code: number;
}
