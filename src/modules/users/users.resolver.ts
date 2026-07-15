import { Args, Int, Mutation, Query, Resolver } from "@nestjs/graphql";
import { UserType } from "./graphql/user.type";
import { UsersService } from "./users.service";
import { UsersPageType } from "./graphql/users-page.type";
import { UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { PermissionsGuard } from "src/common/guards/permissions.guard";
import { RequirePermissions } from "src/common/decorators/permission.decorator";
import { UserPermission } from "src/common/enums/user-permission.enum";
import { GetUsersInput } from "./graphql/get-users.input";
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import type { CurrentUserData } from 'src/common/decorators/current-user.decorator';
import { UpdateUserRoleInput } from "./graphql/update-user-role.input";
import { UpdateUserStatusInput } from "./graphql/update-user-status.input";

@Resolver(() => UserType)
export class UsersResolver {
    constructor(
        private readonly usersService:
            UsersService,
    ) { }

    @Query(() => UsersPageType, { name: 'users' })
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(UserPermission.USER_VIEW)
    findAll(@Args('query', { type: () => GetUsersInput, nullable: true }) query?: GetUsersInput) {
        return this.usersService.findAll(query ?? new GetUsersInput());
    }

    @Query(() => UserType, { name: 'user' })
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(UserPermission.USER_VIEW)
    findOne(@Args('id', { type: () => Int }) id: number) {
        return this.usersService.findOne(Number(id));
    }

    @Mutation(() => UserType)
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(UserPermission.USER_UPDATE_ROLE)
    updateUserRole(
        @CurrentUser() currentUser: CurrentUserData,
        @Args('id', { type: () => Int }) id: number,
        @Args('input') input: UpdateUserRoleInput
    ) {
        return this.usersService.updateRole(
            currentUser.userId,
            Number(id),
            input
        );
    }

    @Mutation(() => UserType)
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(UserPermission.USER_UPDATE_STATUS)
    updateUserStatus(
        @CurrentUser() currentUser: CurrentUserData,
        @Args('id', { type: () => Int }) id: number,
        @Args('input') input: UpdateUserStatusInput
    ) {
        return this.usersService.updateStatus(
            currentUser.userId,
            Number(id),
            input
        );
    }
}