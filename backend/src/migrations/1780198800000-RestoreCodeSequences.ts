import { MigrationInterface, QueryRunner } from 'typeorm';

export class RestoreCodeSequences1780198800000 implements MigrationInterface {
  name = 'RestoreCodeSequences1780198800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const [[{ max: maxUserCode }], [{ max: maxApptCode }]] = await Promise.all([
      queryRunner.query(`SELECT COALESCE(MAX("code"), 0) AS max FROM "users"`),
      queryRunner.query(`SELECT COALESCE(MAX("code"), 0) AS max FROM "appointments"`),
    ]);

    // Sequences only — no column DEFAULT so TypeORM never detects drift
    await queryRunner.query(`CREATE SEQUENCE users_code_seq START ${Number(maxUserCode) + 1}`);
    await queryRunner.query(`CREATE SEQUENCE appointments_code_seq START ${Number(maxApptCode) + 1}`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP SEQUENCE IF EXISTS appointments_code_seq`);
    await queryRunner.query(`DROP SEQUENCE IF EXISTS users_code_seq`);
  }
}
