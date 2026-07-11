import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { RolePermissionType } from "./graphql/role-permission.type";
import { UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { RolesGuard } from "src/common/guards/roles.guard";
import { Roles } from "src/common/decorators/roles.decorator";
import { UserRole } from "src/common/enums/user-role.enum";
import { RolePermissionsService } from "./role-permissions.service";
import { UpdateRolePermissionsInput } from "./graphql/update-role-permissions.input";

@Resolver(() => RolePermissionType)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class RolePermissionsResolver {
    constructor(
        private readonly rolePermissionsService: RolePermissionsService,
    ) { }

    @Query(() => [RolePermissionType])
    rolePermissions() {
        return this.rolePermissionsService.findAll();
    }

    @Query(() => [RolePermissionType])
    rolePermissionsByRole(
        @Args('role', { type: () => UserRole })
        role: UserRole,
    ) {
        return this.rolePermissionsService.findByRole(role);
    }

    @Mutation(() => [RolePermissionType])
    updateRolePermissions(
        @Args('role', { type: () => UserRole })
        role: UserRole,

        @Args('input')
        input: UpdateRolePermissionsInput,
    ) {
        return this.rolePermissionsService.updateRolePermissions(
            role,
            input.permissions,
        );
    }
}