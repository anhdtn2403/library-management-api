import { Field, Int, ObjectType } from "@nestjs/graphql";
import { LoanType } from "./loan.type";

@ObjectType()
export class LoansPageType {
    @Field(() => Int)
    pageNumber!: number;

    @Field(() => Int)
    pageSize!: number;

    @Field(() => Int)
    totalItems!: number;

    @Field(() => Int)
    totalPages!: number;

    @Field(() => [LoanType])
    items!: LoanType[];
}