import { UseGuards } from "@nestjs/common";
import { Args, Int, Query, Resolver } from "@nestjs/graphql";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { PermissionsGuard } from "src/common/guards/permissions.guard";
import { DashboardService } from "./dashboard.service";
import { DashboardSummaryType } from "./graphql/dashboard-summary.type";
import { UserPermission } from "src/common/enums/user-permission.enum";
import { RequirePermissions } from "src/common/decorators/permission.decorator";
import { DashboardFilterInput } from "./graphql/dashboard-filter.input";
import { DashboardLoanStatusType } from "./graphql/dashboard-loan-status.type";
import { DashboardBookStatisticType } from "./graphql/dashboard-book-statistic.type";

@Resolver()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DashboardResolver {
    constructor(
        private readonly dashboardService: DashboardService,
    ) { }

    @Query(() => DashboardSummaryType, { name: 'dashboardSummary', })
    @RequirePermissions(UserPermission.DASHBOARD_VIEW)
    getSummary(
        @Args('input', { type: () => DashboardFilterInput, nullable: true })
        input?: DashboardFilterInput
    ) {
        return this.dashboardService.getSummary(input);
    }

    @Query(() => [DashboardLoanStatusType], { name: 'dashboardLoanStatusStatistics', })
    @RequirePermissions(UserPermission.DASHBOARD_VIEW)
    getLoanStatusStatistics(
        @Args('input', { type: () => DashboardFilterInput, nullable: true, })
        input?: DashboardFilterInput
    ) {
        return this.dashboardService.getLoanStatusStatistics(input);
    }

    @Query(() => [DashboardBookStatisticType], { name: 'dashboardTopBorrowedBooks', })
    @RequirePermissions(UserPermission.DASHBOARD_VIEW)
    getTopBorrowedBooks(
        @Args('limit', { type: () => Int, nullable: true, defaultValue: 5, })
        limit: number,
        @Args('input', { type: () => DashboardFilterInput, nullable: true, })
        input?: DashboardFilterInput
    ) {
        const safeLimit = Math.min(Math.max(limit, 1), 20,);
        return this.dashboardService.getTopBorrowedBooks(safeLimit, input);
    }
}