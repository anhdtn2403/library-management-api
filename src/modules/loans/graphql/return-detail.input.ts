import { Field, InputType, Int } from "@nestjs/graphql";
import { IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

@InputType()
export class ReturnDetailInput {
    @Field(() => Int)
    @IsInt()
    @Min(0)
    return_quantity!: number;

    @Field(() => Int)
    @IsInt()
    @Min(0)
    lost_quantity!: number;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    note?: string;
}