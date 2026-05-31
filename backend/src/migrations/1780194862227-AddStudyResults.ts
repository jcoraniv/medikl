import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStudyResults1780194862227 implements MigrationInterface {
    name = 'AddStudyResults1780194862227'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."study_results_status_enum" AS ENUM('pending', 'reviewed')`);
        await queryRunner.query(`CREATE TABLE "study_results" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "appointmentId" uuid NOT NULL, "patientId" uuid NOT NULL, "doctorId" uuid NOT NULL, "findings" text NOT NULL, "conclusion" text, "status" "public"."study_results_status_enum" NOT NULL DEFAULT 'pending', "reviewedAt" TIMESTAMP, CONSTRAINT "PK_bf5d53356b03af9ae3083ba7113" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "study_results" ADD CONSTRAINT "FK_50e2e5298b12dc3b738b082e8f9" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "study_results" ADD CONSTRAINT "FK_e6831c11bde417ccfdde2027bd1" FOREIGN KEY ("patientId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "study_results" ADD CONSTRAINT "FK_67d685c1d2f4b0c6ba03e4a67a2" FOREIGN KEY ("doctorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "study_results" DROP CONSTRAINT "FK_67d685c1d2f4b0c6ba03e4a67a2"`);
        await queryRunner.query(`ALTER TABLE "study_results" DROP CONSTRAINT "FK_e6831c11bde417ccfdde2027bd1"`);
        await queryRunner.query(`ALTER TABLE "study_results" DROP CONSTRAINT "FK_50e2e5298b12dc3b738b082e8f9"`);
        await queryRunner.query(`DROP TABLE "study_results"`);
        await queryRunner.query(`DROP TYPE "public"."study_results_status_enum"`);
    }

}
