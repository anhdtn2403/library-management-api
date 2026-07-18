import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class DashboardChartPointType {
    @Field()
    label!: string;

    @Field(() => Int)
    loan_count!: number;

    @Field(() => Float)
    revenue!: number;
}