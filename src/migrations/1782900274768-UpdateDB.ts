import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateDB1782900274768 implements MigrationInterface {
    name = 'UpdateDB1782900274768'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."role_permissions_permission_enum" ADD VALUE 'LOAN_VIEW'`);
        await queryRunner.query(`ALTER TYPE "public"."role_permissions_permission_enum" ADD VALUE 'LOAN_CREATE'`);
        await queryRunner.query(`ALTER TYPE "public"."role_permissions_permission_enum" ADD VALUE 'LOAN_UPDATE'`);
        await queryRunner.query(`ALTER TYPE "public"."role_permissions_permission_enum" ADD VALUE 'LOAN_UPDATE_STATUS'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."role_permissions_permission_enum_old" AS ENUM('BOOK_VIEW', 'BOOK_CREATE', 'BOOK_UPDATE', 'BOOK_DELETE', 'USER_VIEW', 'USER_UPDATE_ROLE', 'PERMISSION_MANAGE')`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ALTER COLUMN "permission" TYPE "public"."role_permissions_permission_enum_old" USING "permission"::"text"::"public"."role_permissions_permission_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."role_permissions_permission_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."role_permissions_permission_enum_old" RENAME TO "role_permissions_permission_enum"`);
    }

}
