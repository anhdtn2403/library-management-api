import { Field, ID, ObjectType } from "@nestjs/graphql";
import { UserPermission } from "src/common/enums/user-permission.enum";
import { UserRole } from "src/common/enums/user-role.enum";

@ObjectType()
export class RolePermissionType {
    @Field(() => ID)
    id!: number;

    @Field(() => UserRole)
    role!: UserRole;

    @Field(() => UserPermission)
    permission!: UserPermission;
}