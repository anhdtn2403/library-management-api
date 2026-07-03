import { Module } from '@nestjs/common';
import { BooksModule } from './modules/books/books.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Book } from './entities/book.entity';
import { User } from './entities/user.entity';
import { Loan } from './entities/loan.entity';
import { LoanDetail } from './entities/loan-detail.entity';
import { AuthsModule } from './modules/auths/auths.module';
import { RolePermission } from './entities/role-permission.entity';
import { RolePermissionsModule } from './modules/role-permissions/role-permissions.module';
import { LoansModule } from './modules/loans/loans.module';
import { LmsNotification } from './entities/lms-notification.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { LmsNotificationsModule } from './modules/lms-notifications/lms-notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_DATABASE'),

        entities: [Book, User, Loan, LoanDetail, RolePermission, LmsNotification],

        synchronize: false,
      })
    }),
    BooksModule,
    AuthsModule,
    RolePermissionsModule,
    LoansModule,
    LmsNotificationsModule
  ]
})
export class AppModule { }
