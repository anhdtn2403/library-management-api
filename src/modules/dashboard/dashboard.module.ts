import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Book } from 'src/entities/book.entity';
import { User } from 'src/entities/user.entity';
import { Loan } from 'src/entities/loan.entity';
import { LoanDetail } from 'src/entities/loan-detail.entity';
import { RolePermission } from 'src/entities/role-permission.entity';
import { DashboardResolver } from './dashboard.resolver';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Book, User, Loan, LoanDetail, RolePermission])
  ],
  providers: [DashboardService, DashboardResolver, PermissionsGuard]
})
export class DashboardModule { }
