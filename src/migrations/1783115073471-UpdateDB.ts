import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateDB1783115073471 implements MigrationInterface {
    name = 'UpdateDB1783115073471'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "books" RENAME COLUMN "available_quantity" TO "borrowed_quantity"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "books" RENAME COLUMN "borrowed_quantity" TO "available_quantity"`);
    }

}
