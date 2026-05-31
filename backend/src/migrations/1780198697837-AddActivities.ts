import { MigrationInterface, QueryRunner } from "typeorm";

export class AddActivities1780198697837 implements MigrationInterface {
    name = 'AddActivities1780198697837'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."activities_type_enum" AS ENUM('APPOINTMENT_SCHEDULED', 'APPOINTMENT_UPDATED', 'APPOINTMENT_COMPLETED', 'APPOINTMENT_CANCELLED', 'RESULT_CREATED', 'RESULT_UPDATED')`);
        await queryRunner.query(`CREATE TABLE "activities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "type" "public"."activities_type_enum" NOT NULL, "patientId" character varying NOT NULL, "entityId" character varying NOT NULL, "entityType" character varying NOT NULL, "snapshot" jsonb NOT NULL, "delta" jsonb, "generatedText" text NOT NULL, "embedding" double precision array, CONSTRAINT "PK_7f4004429f731ffb9c88eb486a8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "code" DROP DEFAULT`);
        await queryRunner.query(`DROP SEQUENCE "users_code_seq"`);
        await queryRunner.query(`ALTER TABLE "appointments" ALTER COLUMN "code" DROP DEFAULT`);
        await queryRunner.query(`DROP SEQUENCE "appointments_code_seq"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE SEQUENCE IF NOT EXISTS "appointments_code_seq" OWNED BY "appointments"."code"`);
        await queryRunner.query(`ALTER TABLE "appointments" ALTER COLUMN "code" SET DEFAULT nextval('"appointments_code_seq"')`);
        await queryRunner.query(`CREATE SEQUENCE IF NOT EXISTS "users_code_seq" OWNED BY "users"."code"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "code" SET DEFAULT nextval('"users_code_seq"')`);
        await queryRunner.query(`DROP TABLE "activities"`);
        await queryRunner.query(`DROP TYPE "public"."activities_type_enum"`);
    }

}
