import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixUserDeletedAtColumnName1780212000000 implements MigrationInterface {
  name = 'FixUserDeletedAtColumnName1780212000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const rows: { column_name: string }[] = await queryRunner.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'users' AND column_name = 'deleted_at'`,
    );
    if (rows.length > 0) {
      await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "deleted_at" TO "deletedAt"`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const rows: { column_name: string }[] = await queryRunner.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'users' AND column_name = '"deletedAt"'`,
    );
    if (rows.length > 0) {
      await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "deletedAt" TO "deleted_at"`);
    }
  }
}
