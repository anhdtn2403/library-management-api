import { Field, InputType } from "@nestjs/graphql";
import { IsArray, IsEnum } from "class-validator";
import { UserPermission } from "src/common/enums/user-permission.enum";

@InputType()
export class UpdateRolePermissionsInput {
    @Field(() => [UserPermission])
    @IsArray()
    @IsEnum(UserPermission, { each: true })
    permissions!: UserPermission[];
}