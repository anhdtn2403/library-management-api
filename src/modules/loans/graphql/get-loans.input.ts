import { Field, InputType, Int } from "@nestjs/graphql";
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { LoanStatus } from "src/common/enums/loan-status.enum";

@InputType()
export class GetLoansInput {
    @Field(() => LoanStatus, { nullable: true })
    @IsOptional()
    @IsEnum(LoanStatus)
    status?: LoanStatus;

    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    user_id?: number;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    keyword?: string;

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