import { Field, InputType, Int } from "@nestjs/graphql";
import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsInt, Min, ValidateNested } from "class-validator";

@InputType()
export class CreateLoanItemInput {
    @Field(() => Int)
    @IsInt()
    book_id!: number;

    @Field(() => Int)
    @IsInt()
    @Min(1)
    quantity!: number;

    @Field(() => Int)
    @IsInt()
    @Min(1)
    borrow_days!: number;
}

@InputType()
export class CreateLoanInput {
    @Field(() => [CreateLoanItemInput])
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => CreateLoanItemInput)
    items!: CreateLoanItemInput[];
}