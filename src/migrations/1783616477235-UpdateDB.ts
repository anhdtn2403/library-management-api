import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateDB1783616477235 implements MigrationInterface {
    name = 'UpdateDB1783616477235'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "loans" ADD "cancelled_reason" character varying(500)`);
        await queryRunner.query(`ALTER TABLE "loan_details" ADD "lost_quantity" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "loan_details" DROP COLUMN "lost_quantity"`);
        await queryRunner.query(`ALTER TABLE "loans" DROP COLUMN "cancelled_reason"`);
    }

}
