import { Field, InputType, Int } from "@nestjs/graphql";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

@InputType()
export class GetFavoriteBooksInput {
    @Field(() => Int, {
        nullable: true,
        defaultValue: 1,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    page?: number = 1;

    @Field(() => Int, {
        nullable: true,
        defaultValue: 10,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    pageSize?: number = 10;

    @Field({
        nullable: true,
    })
    @IsOptional()
    @IsString()
    keyword?: string;
}