import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class MarkNotificationsReadResultType {
    @Field()
    message!: string;

    @Field(() => [Int])
    ids!: number[];
}