import { Field, InputType } from "@nestjs/graphql";
import { IsEnum } from "class-validator";
import { UserRole } from "src/common/enums/user-role.enum";

@InputType()
export class UpdateUserRoleInput {
    @Field(() => UserRole)
    @IsEnum(UserRole)
    role!: UserRole;
}