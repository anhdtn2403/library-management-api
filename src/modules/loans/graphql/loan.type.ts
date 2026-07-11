import { Field, Float, ID, Int, ObjectType } from "@nestjs/graphql";
import { LoanDetailStatus, LoanStatus } from "src/common/enums/loan-status.enum";

@ObjectType()
export class LoanBorrowerType {
    @Field(() => ID)
    user_id!: number;

    @Field()
    full_name!: string;

    @Field()
    email!: string;
}

@ObjectType()
export class LoanBookType {
    @Field(() => ID)
    loan_detail_id!: number;

    @Field(() => ID)
    book_id!: number;

    @Field()
    title!: string;

    @Field({ nullable: true })
    author?: string;

    @Field({ nullable: true })
    image_url?: string;

    @Field(() => Int)
    quantity!: number;

    @Field(() => Int)
    borrow_days!: number;

    @Field({ nullable: true })
    due_date?: Date;

    @Field({ nullable: true })
    return_date?: Date;

    @Field(() => LoanDetailStatus)
    status!: LoanDetailStatus;

    @Field(() => Float)
    deposit_amount!: number;

    @Field(() => Float)
    rental_fee!: number;

    @Field(() => Float)
    fine_amount!: number;

    @Field(() => Int)
    lost_quantity!: number;

    @Field(() => Float)
    lost_fee!: number;

    @Field(() => Float)
    deposit_refund_amount!: number;

    @Field(() => Float)
    extra_payment_amount!: number;
}

@ObjectType()
export class LoanType {
    @Field(() => ID)
    id!: number;

    @Field({ nullable: true })
    loan_date?: Date;

    @Field(() => LoanStatus)
    status!: LoanStatus;

    @Field({ nullable: true })
    cancelled_reason?: string;

    @Field(() => Float)
    total_deposit!: number;

    @Field(() => Float)
    total_rental_fee!: number;

    @Field(() => Float)
    total_amount!: number;

    @Field(() => Float)
    total_fine!: number;

    @Field(() => Float)
    total_lost_fee!: number;

    @Field(() => Float, { nullable: true })
    total_initial_payment?: number;

    @Field(() => Float, { nullable: true })
    total_deposit_refund?: number;

    @Field(() => Float, { nullable: true })
    total_extra_payment?: number;

    @Field(() => LoanBorrowerType, {
        nullable: true,
    })
    borrower?: LoanBorrowerType;

    @Field(() => [LoanBookType])
    books!: LoanBookType[];
}