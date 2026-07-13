import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateDB1783974840159 implements MigrationInterface {
    name = 'UpdateDB1783974840159'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "returned_histories" ("id" SERIAL NOT NULL, "loan_detail_id" integer NOT NULL, "return_date" TIMESTAMP NOT NULL, "return_quantity" integer NOT NULL DEFAULT '0', "lost_quantity" integer NOT NULL DEFAULT '0', "late_days" integer NOT NULL DEFAULT '0', "fine_amount" numeric(12,2) NOT NULL DEFAULT '0', "lost_fee" numeric(12,2) NOT NULL DEFAULT '0', "deposit_refund_amount" numeric(12,2) NOT NULL DEFAULT '0', "extra_payment_amount" numeric(12,2) NOT NULL DEFAULT '0', "note" character varying(500), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_23119cbe998f68c6435fbf3cf1e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`
            ALTER TABLE "loan_details"
            RENAME COLUMN "return_date" TO "completed_at"
        `);
        await queryRunner.query(`ALTER TABLE "loan_details" ADD "returned_quantity" integer NOT NULL DEFAULT '0'`);

        // sửa dữ liệu cũ đang NULL
        // COALESCE(value, 0) có nghĩa: 
        // nếu value là NULL thì lấy 0
        // ngược lại giữ nguyên value hiện tại
        await queryRunner.query(`
            UPDATE "loan_details"
            SET
            "fine_amount" = COALESCE("fine_amount", 0),
            "lost_quantity" = COALESCE("lost_quantity", 0),
            "lost_fee" = COALESCE("lost_fee", 0),
            "deposit_refund_amount" =
                COALESCE("deposit_refund_amount", 0),
            "extra_payment_amount" =
                COALESCE("extra_payment_amount", 0)`);

        // đặt default cho dữ liệu mới. 
        await queryRunner.query(`ALTER TABLE "loan_details" ALTER COLUMN "fine_amount" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "loan_details" ALTER COLUMN "lost_quantity" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "loan_details" ALTER COLUMN "lost_fee" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "loan_details" ALTER COLUMN "deposit_refund_amount" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "loan_details" ALTER COLUMN "extra_payment_amount" SET DEFAULT '0'`);

        // sau khi không còn NULL mới đặt NOT NULL.
        await queryRunner.query(`ALTER TABLE "loan_details" ALTER COLUMN "fine_amount" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "loan_details" ALTER COLUMN "lost_quantity" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "loan_details" ALTER COLUMN "lost_fee" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "loan_details" ALTER COLUMN "deposit_refund_amount" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "loan_details" ALTER COLUMN "extra_payment_amount" SET NOT NULL`);

        await queryRunner.query(`ALTER TABLE "returned_histories" ADD CONSTRAINT "FK_40d8a625257d23554df2562bfea" FOREIGN KEY ("loan_detail_id") REFERENCES "loan_details"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(
        queryRunner: QueryRunner,
    ): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "returned_histories"
            DROP CONSTRAINT
                "FK_40d8a625257d23554df2562bfea"
        `);
        await queryRunner.query(`
            ALTER TABLE "loan_details"
            ALTER COLUMN "extra_payment_amount"
            DROP NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "loan_details"
            ALTER COLUMN "extra_payment_amount"
            DROP DEFAULT
        `);
        await queryRunner.query(`
            ALTER TABLE "loan_details"
            ALTER COLUMN "deposit_refund_amount"
            DROP NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "loan_details"
            ALTER COLUMN "deposit_refund_amount"
            DROP DEFAULT
        `);
        await queryRunner.query(`
            ALTER TABLE "loan_details"
            ALTER COLUMN "lost_fee"
            DROP NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "loan_details"
            ALTER COLUMN "lost_fee"
            DROP DEFAULT
        `);
        await queryRunner.query(`
            ALTER TABLE "loan_details"
            ALTER COLUMN "lost_quantity"
            DROP NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "loan_details"
            ALTER COLUMN "lost_quantity"
            DROP DEFAULT
        `);
        await queryRunner.query(`
            ALTER TABLE "loan_details"
            ALTER COLUMN "fine_amount"
            DROP NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "loan_details"
            ALTER COLUMN "fine_amount"
            DROP DEFAULT
        `);
        await queryRunner.query(`
            ALTER TABLE "loan_details"
            DROP COLUMN "returned_quantity"
        `);
        await queryRunner.query(`
            ALTER TABLE "loan_details"
            RENAME COLUMN "completed_at"
            TO "return_date"
        `);
        await queryRunner.query(`
            DROP TABLE "returned_histories"
        `);
    }

}
