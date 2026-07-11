import { Field, ID, ObjectType } from "@nestjs/graphql";
import { NotificationType } from "src/common/enums/notification-type.enum";

@ObjectType()
export class LmsNotificationType {
    @Field(() => ID)
    id!: number;

    @Field(() => ID)
    user_id!: number;

    @Field()
    title!: string;

    @Field()
    message!: string;

    @Field(() => NotificationType)
    type!: NotificationType;

    @Field()
    is_read!: boolean;

    @Field()
    created_at!: Date;

    @Field()
    updated_at!: Date;
}