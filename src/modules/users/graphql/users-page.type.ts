import { Field, Int, ObjectType } from "@nestjs/graphql";
import { UserType } from "./user.type";

@ObjectType()
export class UsersPageType {
    @Field(() => Int)
    pageNumber!: number;

    @Field(() => Int)
    pageSize!: number;

    @Field(() => Int)
    totalItems!: number;

    @Field(() => Int)
    totalPages!: number;

    @Field(() => [UserType])
    items!: UserType[];
}