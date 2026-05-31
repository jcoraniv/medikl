import { MigrationInterface, QueryRunner } from "typeorm";

export class DropStudyResultStatus1780196582030 implements MigrationInterface {
    name = 'DropStudyResultStatus1780196582030'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "study_results" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."study_results_status_enum"`);
        await queryRunner.query(`ALTER TABLE "study_results" DROP COLUMN "reviewedAt"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "study_results" ADD "reviewedAt" TIMESTAMP`);
        await queryRunner.query(`CREATE TYPE "public"."study_results_status_enum" AS ENUM('pending', 'reviewed')`);
        await queryRunner.query(`ALTER TABLE "study_results" ADD "status" "public"."study_results_status_enum" NOT NULL DEFAULT 'pending'`);
    }

}
