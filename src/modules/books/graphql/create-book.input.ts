import { Field, Float, InputType, Int } from "@nestjs/graphql";
import { IsInt, IsISBN, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";

@InputType()
export class CreateBookInput {
    @Field(() => Int)
    @IsInt()
    sub_category_id!: number;

    @Field()
    @IsString()
    @IsNotEmpty({
        message: 'Tên sách không được để trống',
    })
    title!: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsISBN('13')
    isbn?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    author?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    publisher?: string;

    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    @Min(0)
    publisher_year?: number;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    description?: string;

    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    @Min(0)
    total_quantity?: number;

    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    @Min(1)
    max_borrow_days?: number;

    @Field(() => Float, { nullable: true })
    @IsOptional()
    @Min(0)
    deposit_amount?: number;

    @Field(() => Float, { nullable: true })
    @IsOptional()
    @Min(0)
    fine_per_day?: number;

    @Field(() => Float, { nullable: true })
    @IsOptional()
    @Min(0)
    replacement_cost?: number;

    @Field(() => Float, { nullable: true })
    @IsOptional()
    @Min(0)
    fee_per_day?: number;

    @Field(() => Float, { nullable: true })
    @IsOptional()
    @Min(0)
    fee_per_week?: number;

    @Field(() => Float, { nullable: true })
    @IsOptional()
    @Min(0)
    fee_per_month?: number;
}