import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateDB1784146099343 implements MigrationInterface {
    name = 'UpdateDB1784146099343'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_favorite_books" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "book_id" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ab1cf8d5634cda7873fcb89e5da" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user_favorite_books" ADD CONSTRAINT "FK_54902ea94244b2d32478b87d407" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_favorite_books" ADD CONSTRAINT "FK_4110dbbb1dceff218fd6d2d2898" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_favorite_books" DROP CONSTRAINT "FK_4110dbbb1dceff218fd6d2d2898"`);
        await queryRunner.query(`ALTER TABLE "user_favorite_books" DROP CONSTRAINT "FK_54902ea94244b2d32478b87d407"`);
        await queryRunner.query(`DROP TABLE "user_favorite_books"`);
    }

}
