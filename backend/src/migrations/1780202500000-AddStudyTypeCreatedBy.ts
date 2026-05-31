import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStudyTypeCreatedBy1780202500000 implements MigrationInterface {
  name = 'AddStudyTypeCreatedBy1780202500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "study_types"
      ADD COLUMN "createdById" uuid REFERENCES "users"("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "study_types" DROP COLUMN "createdById"`);
  }
}
