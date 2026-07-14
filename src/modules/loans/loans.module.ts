import { Module } from '@nestjs/common';
import { LoansService } from './loans.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Loan } from 'src/entities/loan.entity';
import { LoanDetail } from 'src/entities/loan-detail.entity';
import { Book } from 'src/entities/book.entity';
import { User } from 'src/entities/user.entity';
import { RolePermission } from 'src/entities/role-permission.entity';
import { LmsNotificationsModule } from '../lms-notifications/lms-notifications.module';
import { LoansCronService } from './loans-cron.service';
import { LoansResolver } from './loans.resolver';
import { ReturnedHistory } from 'src/entities/returned-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Loan,
      LoanDetail,
      ReturnedHistory,
      Book,
      User,
      RolePermission,
    ]),
    LmsNotificationsModule
  ],
  providers: [LoansService, LoansCronService, LoansResolver],
})
export class LoansModule { }
