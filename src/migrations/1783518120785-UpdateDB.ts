import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateDB1783518120785 implements MigrationInterface {
    name = 'UpdateDB1783518120785'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."loan_details_status_enum" RENAME TO "loan_details_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."loan_details_status_enum" AS ENUM('PENDING', 'BORROWING', 'OVERDUE', 'RETURNED', 'CANCELLED')`);
        await queryRunner.query(`ALTER TABLE "loan_details" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "loan_details" ALTER COLUMN "status" TYPE "public"."loan_details_status_enum" USING "status"::"text"::"public"."loan_details_status_enum"`);
        await queryRunner.query(`ALTER TABLE "loan_details" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."loan_details_status_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."role_permissions_permission_enum" RENAME TO "role_permissions_permission_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."role_permissions_permission_enum" AS ENUM('BOOK_VIEW', 'BOOK_CREATE', 'BOOK_UPDATE', 'BOOK_DELETE', 'USER_VIEW', 'USER_UPDATE_ROLE', 'LOAN_VIEW', 'LOAN_CREATE', 'LOAN_CONFIRM', 'LOAN_BORROWING', 'LOAN_DETAIL_RETURN', 'LOAN_CANCEL', 'CATEGORY_VIEW', 'CATEGORY_CREATE', 'CATEGORY_UPDATE', 'CATEGORY_DELETE', 'SUB_CATEGORY_VIEW', 'SUB_CATEGORY_CREATE', 'SUB_CATEGORY_UPDATE', 'SUB_CATEGORY_DELETE', 'PERMISSION_MANAGE')`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ALTER COLUMN "permission" TYPE "public"."role_permissions_permission_enum" USING "permission"::"text"::"public"."role_permissions_permission_enum"`);
        await queryRunner.query(`DROP TYPE "public"."role_permissions_permission_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."role_permissions_permission_enum_old" AS ENUM('BOOK_VIEW', 'BOOK_CREATE', 'BOOK_UPDATE', 'BOOK_DELETE', 'USER_VIEW', 'USER_UPDATE_ROLE', 'LOAN_VIEW', 'LOAN_CREATE', 'LOAN_UPDATE', 'LOAN_UPDATE_STATUS', 'PERMISSION_MANAGE')`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ALTER COLUMN "permission" TYPE "public"."role_permissions_permission_enum_old" USING "permission"::"text"::"public"."role_permissions_permission_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."role_permissions_permission_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."role_permissions_permission_enum_old" RENAME TO "role_permissions_permission_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."loan_details_status_enum_old" AS ENUM('PENDING', 'BORROWING', 'RETURNED', 'OVERDUE', 'LOST', 'CANCELLED')`);
        await queryRunner.query(`ALTER TABLE "loan_details" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "loan_details" ALTER COLUMN "status" TYPE "public"."loan_details_status_enum_old" USING "status"::"text"::"public"."loan_details_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "loan_details" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."loan_details_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."loan_details_status_enum_old" RENAME TO "loan_details_status_enum"`);
    }

}
