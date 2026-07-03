import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateDB1783094060947 implements MigrationInterface {
    name = 'UpdateDB1783094060947'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."lms_ notifications_type_enum" AS ENUM('LOAN_OVERDUE')`);
        await queryRunner.query(`CREATE TABLE "lms_ notifications" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "title" character varying(255) NOT NULL, "message" text NOT NULL, "type" "public"."lms_ notifications_type_enum" NOT NULL, "is_read" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a71cf7cb01f0fdc02b7c17bfddf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "lms_ notifications" ADD CONSTRAINT "FK_6b63e407a0f7491b4f058fd678f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "lms_ notifications" DROP CONSTRAINT "FK_6b63e407a0f7491b4f058fd678f"`);
        await queryRunner.query(`DROP TABLE "lms_ notifications"`);
        await queryRunner.query(`DROP TYPE "public"."lms_ notifications_type_enum"`);
    }

}
