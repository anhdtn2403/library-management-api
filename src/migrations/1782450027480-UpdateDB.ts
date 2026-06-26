import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateDB1782450027480 implements MigrationInterface {
    name = 'UpdateDB1782450027480'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('ADMIN', 'LIBRARIAN', 'MEMBER')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "username" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "password_hash" character varying(255) NOT NULL, "full_name" character varying(255) NOT NULL, "avatar" character varying(500), "role" "public"."users_role_enum" NOT NULL DEFAULT 'MEMBER', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."loans_status_enum" AS ENUM('BORROWING', 'RETURNED', 'OVERDUE', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "loans" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "loan_date" TIMESTAMP NOT NULL, "due_date" TIMESTAMP NOT NULL, "return_date" TIMESTAMP, "status" "public"."loans_status_enum" NOT NULL, CONSTRAINT "PK_5c6942c1e13e4de135c5203ee61" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "loan_details" ("id" SERIAL NOT NULL, "loan_id" integer NOT NULL, "book_id" integer NOT NULL, "quantity" integer NOT NULL, CONSTRAINT "PK_fef95148c177c36bed4da6c0dd5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "books" ("id" SERIAL NOT NULL, "title" character varying(255) NOT NULL, "isbn" character varying(50), "author" character varying(255), "image_url" character varying(500), "publisher" character varying(255), "publisher_year" integer, "description" text, "total_quantity" integer NOT NULL DEFAULT '0', "available_quantity" integer NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f3f2f25a099d24e12545b70b022" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "loans" ADD CONSTRAINT "FK_d135791c39e46e13ca4c2725fbb" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "loan_details" ADD CONSTRAINT "FK_177f98206f8d285a36ee16a9a95" FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "loan_details" ADD CONSTRAINT "FK_16e9bb32abc1844d05ca23fad4e" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "loan_details" DROP CONSTRAINT "FK_16e9bb32abc1844d05ca23fad4e"`);
        await queryRunner.query(`ALTER TABLE "loan_details" DROP CONSTRAINT "FK_177f98206f8d285a36ee16a9a95"`);
        await queryRunner.query(`ALTER TABLE "loans" DROP CONSTRAINT "FK_d135791c39e46e13ca4c2725fbb"`);
        await queryRunner.query(`DROP TABLE "books"`);
        await queryRunner.query(`DROP TABLE "loan_details"`);
        await queryRunner.query(`DROP TABLE "loans"`);
        await queryRunner.query(`DROP TYPE "public"."loans_status_enum"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }

}
