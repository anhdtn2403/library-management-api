import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateDB1784561482237 implements MigrationInterface {
    name = 'UpdateDB1784561482237'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "is_email_verified" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD "email_verification_token_hash" character varying(64)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "email_verification_expires_at" TIMESTAMP`);

        // Các tài khoản tồn tại trước khi có chức năng xác thực email
        // được xem là đã xác thực để không bị khóa đăng nhập.
        await queryRunner.query(`
            UPDATE "users"
            SET "is_email_verified" = true
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email_verification_expires_at"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email_verification_token_hash"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_email_verified"`);
    }

}
