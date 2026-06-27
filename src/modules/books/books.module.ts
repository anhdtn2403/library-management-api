import { Module } from '@nestjs/common';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Book } from 'src/entities/book.entity';
import { LoanDetail } from 'src/entities/loan-detail.entity';
import { Loan } from 'src/entities/loan.entity';
import { User } from 'src/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Book, LoanDetail, Loan, User])],
  controllers: [BooksController],
  providers: [BooksService]
})
export class BooksModule { }
