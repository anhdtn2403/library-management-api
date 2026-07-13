import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateDB1783974840160 implements MigrationInterface {
    name = 'UpdateDB1783974840160'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE "loan_details"
            SET "returned_quantity" =
                GREATEST(
                    "quantity" - COALESCE("lost_quantity", 0),
                    0
                )
            WHERE
                "status" = 'RETURNED'
                AND "returned_quantity" = 0
        `);
    }

    public async down(
        queryRunner: QueryRunner,
    ): Promise<void> {
        // Irreversible data backfill migration.
    }

}