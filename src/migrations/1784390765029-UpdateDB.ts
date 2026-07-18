import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateDB1784390765029 implements MigrationInterface {
    name = 'UpdateDB1784390765029'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."role_permissions_permission_enum" RENAME TO "role_permissions_permission_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."role_permissions_permission_enum" AS ENUM('BOOK_VIEW', 'BOOK_CREATE', 'BOOK_UPDATE', 'BOOK_DELETE', 'USER_VIEW', 'USER_UPDATE_ROLE', 'USER_UPDATE_STATUS', 'LOAN_VIEW', 'LOAN_CREATE', 'LOAN_CONFIRM', 'LOAN_BORROWING', 'LOAN_DETAIL_RETURN', 'LOAN_CANCEL', 'CATEGORY_VIEW', 'CATEGORY_CREATE', 'CATEGORY_UPDATE', 'CATEGORY_DELETE', 'SUB_CATEGORY_VIEW', 'SUB_CATEGORY_CREATE', 'SUB_CATEGORY_UPDATE', 'SUB_CATEGORY_DELETE', 'DASHBOARD_VIEW')`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ALTER COLUMN "permission" TYPE "public"."role_permissions_permission_enum" USING "permission"::"text"::"public"."role_permissions_permission_enum"`);
        await queryRunner.query(`DROP TYPE "public"."role_permissions_permission_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."role_permissions_permission_enum_old" AS ENUM('BOOK_VIEW', 'BOOK_CREATE', 'BOOK_UPDATE', 'BOOK_DELETE', 'USER_VIEW', 'USER_UPDATE_ROLE', 'LOAN_VIEW', 'LOAN_CREATE', 'LOAN_CONFIRM', 'LOAN_BORROWING', 'LOAN_DETAIL_RETURN', 'LOAN_CANCEL', 'CATEGORY_VIEW', 'CATEGORY_CREATE', 'CATEGORY_UPDATE', 'CATEGORY_DELETE', 'SUB_CATEGORY_VIEW', 'SUB_CATEGORY_CREATE', 'SUB_CATEGORY_UPDATE', 'SUB_CATEGORY_DELETE', 'PERMISSION_MANAGE', 'USER_UPDATE_STATUS')`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ALTER COLUMN "permission" TYPE "public"."role_permissions_permission_enum_old" USING "permission"::"text"::"public"."role_permissions_permission_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."role_permissions_permission_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."role_permissions_permission_enum_old" RENAME TO "role_permissions_permission_enum"`);
    }

}
