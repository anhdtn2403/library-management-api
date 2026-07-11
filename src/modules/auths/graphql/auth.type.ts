import { Field, ID, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class AuthTokenType {
    @Field()
    access_token!: string;

    @Field({ nullable: true })
    refresh_token?: string;
}

@ObjectType()
export class RegisteredUserType {
    @Field(() => ID)
    id!: number;

    @Field()
    username!: string;

    @Field()
    email!: string;

    @Field()
    full_name!: string;

    @Field({ nullable: true })
    avatar?: string;

    // @Field(() => UserRole)
    // role!: UserRole;

    @Field()
    is_active!: boolean;

    @Field()
    created_at!: Date;

    @Field()
    updated_at!: Date;
}