import { Field, Int, ObjectType } from '@nestjs/graphql';
import { LoanStatus } from 'src/common/enums/loan-status.enum';

@ObjectType()
export class DashboardLoanStatusType {
    @Field(() => LoanStatus)
    status!: LoanStatus;

    @Field(() => Int)
    count!: number;
}