import { Module } from '@nestjs/common';
import { LoansController } from './loans.controller';
import { LoansService } from './loans.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Loan } from 'src/entities/loan.entity';
import { LoanDetail } from 'src/entities/loan-detail.entity';
import { Book } from 'src/entities/book.entity';
import { User } from 'src/entities/user.entity';
import { RolePermission } from 'src/entities/role-permission.entity';
import { LmsNotificationsModule } from '../lms-notifications/lms-notifications.module';
import { LoansCronService } from './loans-cron.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Loan,
      LoanDetail,
      Book,
      User,
      RolePermission,
    ]),
    LmsNotificationsModule
  ],
  controllers: [LoansController],
  providers: [LoansService, LoansCronService],
})
export class LoansModule { }
