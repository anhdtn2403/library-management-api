import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateDB1782627030618 implements MigrationInterface {
    name = 'UpdateDB1782627030618'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."role_permissions_role_enum" AS ENUM('ADMIN', 'LIBRARIAN', 'MEMBER')`);
        await queryRunner.query(`CREATE TYPE "public"."role_permissions_permission_enum" AS ENUM('BOOK_VIEW', 'BOOK_CREATE', 'BOOK_UPDATE', 'BOOK_DELETE', 'USER_VIEW', 'USER_UPDATE_ROLE', 'PERMISSION_MANAGE')`);
        await queryRunner.query(`CREATE TABLE "role_permissions" ("id" SERIAL NOT NULL, "role" "public"."role_permissions_role_enum" NOT NULL, "permission" "public"."role_permissions_permission_enum" NOT NULL, CONSTRAINT "PK_84059017c90bfcb701b8fa42297" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "books" ADD CONSTRAINT "UQ_54337dc30d9bb2c3fadebc69094" UNIQUE ("isbn")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "books" DROP CONSTRAINT "UQ_54337dc30d9bb2c3fadebc69094"`);
        await queryRunner.query(`DROP TABLE "role_permissions"`);
        await queryRunner.query(`DROP TYPE "public"."role_permissions_permission_enum"`);
        await queryRunner.query(`DROP TYPE "public"."role_permissions_role_enum"`);
    }

}
