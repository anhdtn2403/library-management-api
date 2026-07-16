import { Args, ID, Mutation, Query, Resolver } from "@nestjs/graphql";
import { LmsNotificationType } from "./graphql/notification.type";
import { UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { LmsNotificationsService } from "./lms-notifications.service";
import { MarkNotificationsReadResultType } from "./graphql/mark-notifications-read.type";
import { CurrentUser, type CurrentUserData } from "src/common/decorators/current-user.decorator";

@Resolver(() => LmsNotificationType)
@UseGuards(JwtAuthGuard)
export class LmsNotificationsResolver {
    constructor(
        private readonly notificationsService: LmsNotificationsService,
    ) { }

    @Query(() => [LmsNotificationType])
    notificationsByUser(
        @CurrentUser() currentUser: CurrentUserData
    ) {
        return this.notificationsService.findByUser(currentUser.userId);
    }

    @Mutation(() => MarkNotificationsReadResultType)
    markNotificationsAsRead(
        @CurrentUser() currentUser: CurrentUserData,
        @Args('ids', { type: () => [ID] }) ids: number[],
    ) {
        return this.notificationsService.markAsRead(
            currentUser.userId,
            ids.map(Number)
        );
    }
}