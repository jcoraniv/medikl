import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixUserDeletedAtColumnName1780212000000 implements MigrationInterface {
  name = 'FixUserDeletedAtColumnName1780212000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "deleted_at" TO "deletedAt"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "deletedAt" TO "deleted_at"`);
  }
}
