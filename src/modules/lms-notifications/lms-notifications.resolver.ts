import { Args, ID, Mutation, Query, Resolver } from "@nestjs/graphql";
import { LmsNotificationType } from "./graphql/notification.type";
import { UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { LmsNotificationsService } from "./lms-notifications.service";
import { MarkNotificationsReadResultType } from "./graphql/mark-notifications-read.type";

@Resolver(() => LmsNotificationType)
@UseGuards(JwtAuthGuard)
export class LmsNotificationsResolver {
    constructor(
        private readonly notificationsService: LmsNotificationsService,
    ) { }

    @Query(() => [LmsNotificationType])
    notificationsByUser(
        @Args('userId', { type: () => ID })
        userId: number,
    ) {
        return this.notificationsService.findByUser(Number(userId));
    }

    @Mutation(() => MarkNotificationsReadResultType)
    markNotificationsAsRead(
        @Args('ids', { type: () => [ID] })
        ids: number[],
    ) {
        return this.notificationsService.markAsRead(
            ids.map(Number),
        );
    }
}