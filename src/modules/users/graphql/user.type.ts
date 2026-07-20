import {
    Field,
    ID,
    ObjectType,
} from '@nestjs/graphql';
import { UserRole } from 'src/common/enums/user-role.enum';

@ObjectType()
export class UserType {
    @Field(() => ID)
    id!: number;

    @Field()
    username!: string;

    @Field()
    email!: string;

    @Field()
    full_name!: string;

    @Field({
        nullable: true,
    })
    avatar?: string;

    @Field(() => UserRole)
    role!: UserRole;

    @Field()
    is_active!: boolean;

    @Field()
    is_email_verified!: boolean;

    @Field()
    created_at!: Date;

    @Field()
    updated_at!: Date;
}