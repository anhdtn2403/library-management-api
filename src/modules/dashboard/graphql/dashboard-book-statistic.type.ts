import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class DashboardBookStatisticType {
    @Field(() => ID)
    book_id!: number;

    @Field()
    title!: string;

    @Field({ nullable: true })
    author?: string;

    @Field({ nullable: true })
    image_url?: string;

    @Field(() => Int)
    borrowed_quantity!: number;
}