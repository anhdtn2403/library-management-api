import { Args, ID, Mutation, Query, Resolver } from "@nestjs/graphql";
import { LoanType } from "./graphql/loan.type";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { UseGuards } from "@nestjs/common";
import { PermissionsGuard } from "src/common/guards/permissions.guard";
import { LoansService } from "./loans.service";
import { LoansPageType } from "./graphql/loans-page.type";
import { RequirePermissions } from "src/common/decorators/permission.decorator";
import { UserPermission } from "src/common/enums/user-permission.enum";
import { GetLoansInput } from "./graphql/get-loans.input";
import { CreateLoanInput } from "./graphql/create-loan.input";
import { ReturnDetailInput } from "./graphql/return-detail.input";
import { CancelLoanInput } from "./graphql/cancel-loan.input";
import { CurrentUser, type CurrentUserData } from "src/common/decorators/current-user.decorator";
@Resolver(() => LoanType)
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LoansResolver {
    constructor(private readonly loansService: LoansService) { }

    @Query(() => LoansPageType, {
        name: 'loans',
    })
    @RequirePermissions(UserPermission.LOAN_VIEW)
    findAll(
        @CurrentUser() currentUser: CurrentUserData,
        @Args('query', { type: () => GetLoansInput, nullable: true }) query?: GetLoansInput,
    ) {
        return this.loansService.findAll(currentUser, query ?? new GetLoansInput());
    }

    @Query(() => LoanType, { name: 'loan', })
    @RequirePermissions(UserPermission.LOAN_VIEW)
    findOne(
        @CurrentUser() currentUser: CurrentUserData,
        @Args('id', { type: () => ID }) id: number,
    ) {
        return this.loansService.findOne(currentUser, Number(id));
    }

    @Mutation(() => LoanType)
    @RequirePermissions(UserPermission.LOAN_CREATE)
    createLoan(
        @CurrentUser() currentUser: CurrentUserData,
        @Args('input') input: CreateLoanInput
    ) {
        return this.loansService.create(currentUser.userId, input);
    }

    @Mutation(() => Boolean)
    @RequirePermissions(UserPermission.LOAN_CONFIRM)
    async confirmLoan(
        @Args('id', { type: () => ID })
        id: number,
    ) {
        await this.loansService.confirmLoan(Number(id));
        return true;
    }

    @Mutation(() => Boolean)
    @RequirePermissions(UserPermission.LOAN_BORROWING)
    async payAndBorrow(
        @Args('id', { type: () => ID }) id: number,
    ) {
        await this.loansService.payAndBorrow(Number(id));
        return true;
    }

    @Mutation(() => Boolean)
    @RequirePermissions(UserPermission.LOAN_DETAIL_RETURN)
    async returnLoanDetail(
        @Args('detailId', { type: () => ID }) detailId: number,
        @Args('input') input: ReturnDetailInput) {
        await this.loansService.returnLoanDetail(Number(detailId), input);
        return true;
    }

    @Mutation(() => Boolean)
    @RequirePermissions(UserPermission.LOAN_CANCEL)
    async cancelLoan(
        @CurrentUser() currentUser: CurrentUserData,
        @Args('id', { type: () => ID }) id: number,
        @Args('input') input: CancelLoanInput
    ) {
        await this.loansService.cancelLoan(Number(id), input, currentUser);
        return true;
    }
}