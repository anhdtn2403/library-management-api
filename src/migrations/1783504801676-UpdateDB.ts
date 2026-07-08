import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateDB1783504801676 implements MigrationInterface {
    name = 'UpdateDB1783504801676'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."lms_notifications_type_enum" AS ENUM('LOAN_OVERDUE')`);
        await queryRunner.query(`CREATE TABLE "lms_notifications" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "title" character varying(255) NOT NULL, "message" text NOT NULL, "type" "public"."lms_notifications_type_enum" NOT NULL, "is_read" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_72654a099b5ff7e31b801559481" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('ADMIN', 'LIBRARIAN', 'MEMBER')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "username" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "password_hash" character varying(255) NOT NULL, "full_name" character varying(255) NOT NULL, "avatar" character varying(500), "role" "public"."users_role_enum" NOT NULL DEFAULT 'MEMBER', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."loans_status_enum" AS ENUM('PENDING', 'PENDING_PAYMENT', 'BORROWING', 'COMPLETED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "loans" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "loan_date" TIMESTAMP, "status" "public"."loans_status_enum" NOT NULL DEFAULT 'PENDING', "total_initial_payment" numeric(12,2), "total_deposit_refund" numeric(12,2), "total_extra_payment" numeric(12,2), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5c6942c1e13e4de135c5203ee61" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."loan_details_status_enum" AS ENUM('PENDING', 'BORROWING', 'RETURNED', 'OVERDUE', 'LOST', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "loan_details" ("id" SERIAL NOT NULL, "loan_id" integer NOT NULL, "book_id" integer NOT NULL, "quantity" integer NOT NULL, "borrow_days" integer NOT NULL, "due_date" TIMESTAMP, "return_date" TIMESTAMP, "status" "public"."loan_details_status_enum" NOT NULL DEFAULT 'PENDING', "deposit_amount" numeric(12,2) NOT NULL DEFAULT '0', "rental_fee" numeric(12,2) NOT NULL DEFAULT '0', "fine_amount" numeric(12,2), "lost_fee" numeric(12,2), "deposit_refund_amount" numeric(12,2), "extra_payment_amount" numeric(12,2), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "book_fine_per_day" numeric(12,2) NOT NULL DEFAULT '0', "book_replacement_cost" numeric(12,2) NOT NULL DEFAULT '0', CONSTRAINT "PK_fef95148c177c36bed4da6c0dd5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "categories" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_8b0be371d28245da6e4f4b61878" UNIQUE ("name"), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sub_categories" ("id" SERIAL NOT NULL, "category_id" integer NOT NULL, "name" character varying(255) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f319b046685c0e07287e76c5ab1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "books" ("id" SERIAL NOT NULL, "sub_category_id" integer NOT NULL, "title" character varying(255) NOT NULL, "isbn" character varying(50), "author" character varying(255), "image_url" character varying(500), "publisher" character varying(255), "publisher_year" integer, "description" text, "total_quantity" integer NOT NULL DEFAULT '0', "borrowed_quantity" integer NOT NULL DEFAULT '0', "max_borrow_days" integer NOT NULL DEFAULT '14', "deposit_amount" numeric(12,2) NOT NULL DEFAULT '0', "fine_per_day" numeric(12,2) NOT NULL DEFAULT '0', "replacement_cost" numeric(12,2) NOT NULL DEFAULT '0', "fee_per_day" numeric(12,2) NOT NULL DEFAULT '0', "fee_per_week" numeric(12,2) NOT NULL DEFAULT '0', "fee_per_month" numeric(12,2) NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_54337dc30d9bb2c3fadebc69094" UNIQUE ("isbn"), CONSTRAINT "PK_f3f2f25a099d24e12545b70b022" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."role_permissions_role_enum" AS ENUM('ADMIN', 'LIBRARIAN', 'MEMBER')`);
        await queryRunner.query(`CREATE TYPE "public"."role_permissions_permission_enum" AS ENUM('BOOK_VIEW', 'BOOK_CREATE', 'BOOK_UPDATE', 'BOOK_DELETE', 'USER_VIEW', 'USER_UPDATE_ROLE', 'LOAN_VIEW', 'LOAN_CREATE', 'LOAN_UPDATE', 'LOAN_UPDATE_STATUS', 'PERMISSION_MANAGE')`);
        await queryRunner.query(`CREATE TABLE "role_permissions" ("id" SERIAL NOT NULL, "role" "public"."role_permissions_role_enum" NOT NULL, "permission" "public"."role_permissions_permission_enum" NOT NULL, CONSTRAINT "PK_84059017c90bfcb701b8fa42297" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "lms_notifications" ADD CONSTRAINT "FK_8aea3c12fe7c2a1769ab44f42cb" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "loans" ADD CONSTRAINT "FK_d135791c39e46e13ca4c2725fbb" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "loan_details" ADD CONSTRAINT "FK_177f98206f8d285a36ee16a9a95" FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "loan_details" ADD CONSTRAINT "FK_16e9bb32abc1844d05ca23fad4e" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sub_categories" ADD CONSTRAINT "FK_7a424f07f46010d3441442f7764" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "books" ADD CONSTRAINT "FK_884f947f4fdc0299bff7afa1f83" FOREIGN KEY ("sub_category_id") REFERENCES "sub_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "books" DROP CONSTRAINT "FK_884f947f4fdc0299bff7afa1f83"`);
        await queryRunner.query(`ALTER TABLE "sub_categories" DROP CONSTRAINT "FK_7a424f07f46010d3441442f7764"`);
        await queryRunner.query(`ALTER TABLE "loan_details" DROP CONSTRAINT "FK_16e9bb32abc1844d05ca23fad4e"`);
        await queryRunner.query(`ALTER TABLE "loan_details" DROP CONSTRAINT "FK_177f98206f8d285a36ee16a9a95"`);
        await queryRunner.query(`ALTER TABLE "loans" DROP CONSTRAINT "FK_d135791c39e46e13ca4c2725fbb"`);
        await queryRunner.query(`ALTER TABLE "lms_notifications" DROP CONSTRAINT "FK_8aea3c12fe7c2a1769ab44f42cb"`);
        await queryRunner.query(`DROP TABLE "role_permissions"`);
        await queryRunner.query(`DROP TYPE "public"."role_permissions_permission_enum"`);
        await queryRunner.query(`DROP TYPE "public"."role_permissions_role_enum"`);
        await queryRunner.query(`DROP TABLE "books"`);
        await queryRunner.query(`DROP TABLE "sub_categories"`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`DROP TABLE "loan_details"`);
        await queryRunner.query(`DROP TYPE "public"."loan_details_status_enum"`);
        await queryRunner.query(`DROP TABLE "loans"`);
        await queryRunner.query(`DROP TYPE "public"."loans_status_enum"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TABLE "lms_notifications"`);
        await queryRunner.query(`DROP TYPE "public"."lms_notifications_type_enum"`);
    }

}
