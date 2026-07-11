import { Field, InputType, Int } from "@nestjs/graphql";
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

@InputType()
export class GetBooksInput {
    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    keyword?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    author?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsBoolean()
    is_active?: boolean;

    @Field({ nullable: true })
    @IsOptional()
    @IsBoolean()
    available?: boolean;

    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    category_id?: number;

    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    sub_category_id?: number;

    @Field(() => Int, {
        nullable: true,
        defaultValue: 1,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    page: number = 1;

    @Field(() => Int, {
        nullable: true,
        defaultValue: 10,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    pageSize: number = 10;
}