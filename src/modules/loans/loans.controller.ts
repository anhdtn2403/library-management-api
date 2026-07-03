import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { LoansService } from './loans.service';
import { UserPermission } from 'src/common/enums/user-permission.enum';
import { RequirePermissions } from 'src/common/decorators/permission.decorator';
import { CreateLoanDto } from './dtos/create-loan.dto';
import { UpdateLoanDto } from './dtos/update-loan.dto';
import { UpdateLoanStatusDto } from './dtos/update-loan-status-dto';
import { GetLoansQueryDto } from './dtos/get-loans-query.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('loans')
export class LoansController {
    constructor(private readonly loansService: LoansService) { }

    @Post()
    @RequirePermissions(UserPermission.LOAN_CREATE)
    create(@Body() dto: CreateLoanDto) {
        return this.loansService.create(dto);
    }

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

    @Patch(':id')
    @RequirePermissions(UserPermission.LOAN_UPDATE)
    update(@Param('id') id: string, @Body() dto: UpdateLoanDto) {
        return this.loansService.update(Number(id), dto);
    }

    @Patch(':id/status')
    @RequirePermissions(UserPermission.LOAN_UPDATE_STATUS)
    updateStatus(
        @Param('id') id: string,
        @Body() dto: UpdateLoanStatusDto,
    ) {
        return this.loansService.updateStatus(Number(id), dto);
    }
}
