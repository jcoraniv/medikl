import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStudyTypeSoftDelete1780201403520 implements MigrationInterface {
    name = 'AddStudyTypeSoftDelete1780201403520'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "study_types" ADD "deletedAt" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "study_types" DROP COLUMN "deletedAt"`);
    }

}
