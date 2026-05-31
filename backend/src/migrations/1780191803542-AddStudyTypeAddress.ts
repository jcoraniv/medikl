import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStudyTypeAddress1780191803542 implements MigrationInterface {
    name = 'AddStudyTypeAddress1780191803542'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "study_types" ADD "address" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "study_types" DROP COLUMN "address"`);
    }

}
