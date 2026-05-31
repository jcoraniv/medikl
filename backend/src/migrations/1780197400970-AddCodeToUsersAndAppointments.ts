import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCodeToUsersAndAppointments1780197400970 implements MigrationInterface {
    name = 'AddCodeToUsersAndAppointments1780197400970'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // users
        await queryRunner.query(`CREATE SEQUENCE users_code_seq START 1`);
        await queryRunner.query(`ALTER TABLE "users" ADD "code" integer`);
        await queryRunner.query(`UPDATE "users" SET "code" = nextval('users_code_seq')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "code" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "code" SET DEFAULT nextval('users_code_seq')`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_1f7a2b11e29b1422a2622beab36" UNIQUE ("code")`);

        // appointments
        await queryRunner.query(`CREATE SEQUENCE appointments_code_seq START 1`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD "code" integer`);
        await queryRunner.query(`UPDATE "appointments" SET "code" = nextval('appointments_code_seq')`);
        await queryRunner.query(`ALTER TABLE "appointments" ALTER COLUMN "code" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "appointments" ALTER COLUMN "code" SET DEFAULT nextval('appointments_code_seq')`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD CONSTRAINT "UQ_d838dde2371446d33c990332cb1" UNIQUE ("code")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointments" DROP CONSTRAINT "UQ_d838dde2371446d33c990332cb1"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN "code"`);
        await queryRunner.query(`DROP SEQUENCE appointments_code_seq`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_1f7a2b11e29b1422a2622beab36"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "code"`);
        await queryRunner.query(`DROP SEQUENCE users_code_seq`);
    }

}
