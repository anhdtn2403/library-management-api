import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { LoansService } from './loans.service';
import { UserPermission } from 'src/common/enums/user-permission.enum';
import { RequirePermissions } from 'src/common/decorators/permission.decorator';
import { CreateLoanDto } from './dtos/create-loan.dto';
import { GetLoansQueryDto } from './dtos/get-loans-query.dto';
import { ReturnLoanDetailDto } from './dtos/return-loan-detail.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('loans')
export class LoansController {
    constructor(private readonly loansService: LoansService) { }

    @Get()
    @RequirePermissions(UserPermission.LOAN_VIEW)
    findAll(@Query() query: GetLoansQueryDto) {
        return this.loansService.findAll(query);
    }

    @Get(':id')
    @RequirePermissions(UserPermission.LOAN_VIEW)
    findOne(@Param('id') id: string) {
        return this.loansService.findOne(Number(id));
    }

    @Post()
    @RequirePermissions(UserPermission.LOAN_CREATE)
    create(@Body() dto: CreateLoanDto) {
        return this.loansService.create(dto);
    }

    @Patch(':id/status-to-confirm')
    @RequirePermissions(UserPermission.LOAN_CONFIRM)
    confirmLoan(@Param('id') id: string) {
        return this.loansService.confirmLoan(Number(id));
    }

    @Patch(':id/status-to-borrowing')
    @RequirePermissions(UserPermission.LOAN_BORROWING)
    payAndBorrow(@Param('id') id: string) {
        return this.loansService.payAndBorrow(Number(id));
    }

    @Patch('details/:detailId/status-to-returned')
    @RequirePermissions(UserPermission.LOAN_DETAIL_RETURN)
    returnLoanDetail(
        @Param('detailId') detailId: string,
        @Body() dto: ReturnLoanDetailDto,
    ) {
        return this.loansService.returnLoanDetail(Number(detailId), dto);
    }

    @Patch(':id/cancel')
    @RequirePermissions(UserPermission.LOAN_CANCEL)
    cancelLoan(@Param('id') id: number) {
        return this.loansService.cancelLoan(Number(id));
    }
}
