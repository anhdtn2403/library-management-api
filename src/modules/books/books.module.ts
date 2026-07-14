import { Module } from '@nestjs/common';
import { BooksService } from './books.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Book } from 'src/entities/book.entity';
import { LoanDetail } from 'src/entities/loan-detail.entity';
import { Loan } from 'src/entities/loan.entity';
import { User } from 'src/entities/user.entity';
import { RolePermission } from 'src/entities/role-permission.entity';
import { BooksResolver } from './books.resolver';
import { SubCategory } from 'src/entities/sub-category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Book, LoanDetail, Loan, User, RolePermission, SubCategory])], // Thêm RolePermission vào đây để có thể sử dụng repository của nó trong BooksService
  providers: [BooksService, BooksResolver],
})
export class BooksModule { }
