import { Module } from '@nestjs/common';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Book } from 'src/entities/book.entity';
import { LoanDetail } from 'src/entities/loan-detail.entity';
import { Loan } from 'src/entities/loan.entity';
import { User } from 'src/entities/user.entity';
import { RolePermission } from 'src/entities/role-permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Book, LoanDetail, Loan, User, RolePermission])], // Thêm RolePermission vào đây để có thể sử dụng repository của nó trong BooksService
  controllers: [BooksController],
  providers: [BooksService]
})
export class BooksModule { }
