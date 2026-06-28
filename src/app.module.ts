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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_DATABASE'),

        entities: [Book, User, Loan, LoanDetail, RolePermission],

        synchronize: false,
      })
    }),
    BooksModule,
    AuthsModule,
    RolePermissionsModule
  ]
})
export class AppModule { }
