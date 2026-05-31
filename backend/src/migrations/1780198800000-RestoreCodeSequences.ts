import { MigrationInterface, QueryRunner } from 'typeorm';

export class RestoreCodeSequences1780198800000 implements MigrationInterface {
  name = 'RestoreCodeSequences1780198800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Recreate sequences and restore defaults (dropped by TypeORM in AddActivities migration)
    const [[{ max: maxUserCode }], [{ max: maxApptCode }]] = await Promise.all([
      queryRunner.query(`SELECT COALESCE(MAX("code"), 0) AS max FROM "users"`),
      queryRunner.query(`SELECT COALESCE(MAX("code"), 0) AS max FROM "appointments"`),
    ]);

    await queryRunner.query(`CREATE SEQUENCE users_code_seq START ${Number(maxUserCode) + 1}`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "code" SET DEFAULT nextval('users_code_seq')`);

    await queryRunner.query(`CREATE SEQUENCE appointments_code_seq START ${Number(maxApptCode) + 1}`);
    await queryRunner.query(`ALTER TABLE "appointments" ALTER COLUMN "code" SET DEFAULT nextval('appointments_code_seq')`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "appointments" ALTER COLUMN "code" DROP DEFAULT`);
    await queryRunner.query(`DROP SEQUENCE appointments_code_seq`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "code" DROP DEFAULT`);
    await queryRunner.query(`DROP SEQUENCE users_code_seq`);
  }
}
