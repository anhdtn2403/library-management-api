import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Book } from 'src/entities/book.entity';
import { LoanDetail } from 'src/entities/loan-detail.entity';
import { Loan } from 'src/entities/loan.entity';
import { User } from 'src/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { CreateLoanDto } from './dtos/create-loan.dto';
import { LoanStatus } from 'src/common/enums/loan-status.enum';
import { UpdateLoanDto } from './dtos/update-loan.dto';
import { UpdateLoanStatusDto } from './dtos/update-loan-status-dto';

@Injectable()
export class LoansService {
    constructor(
        @InjectRepository(Loan)
        private readonly loanRepository: Repository<Loan>,

        private readonly dataSource: DataSource,
    ) { }

    findAll() {
        return this.loanRepository.find({
            relations: // join thêm bảng liên qua
            {
                user: true, // join bảng user
                loan_details: {
                    book: true, // join LoanDetail với bảng book để lấy thông tin sách
                },
            },
            order: {
                id: 'DESC', // Sắp xếp giảm dần theo id
            },
        });
    }

    async findOne(id: number) {
        const loan = await this.loanRepository.findOne({
            where: { id },
            relations: {
                user: true,
                loan_details: {
                    book: true,
                },
            },
        });

        if (!loan) {
            throw new NotFoundException('Loan not found');
        }

        return loan;
    }

    async create(dto: CreateLoanDto) {
        return this.dataSource.transaction(async manager => {
            const user = await manager.findOne(User, {
                where: {
                    id: dto.user_id,
                    is_active: true,
                },
            });

            if (!user) {
                throw new NotFoundException('User not found');
            }

            const loan = manager.create(Loan, {
                user_id: dto.user_id,
                loan_date: new Date(),
                due_date: new Date(dto.due_date),
                status: LoanStatus.BORROWING,
            });

            const savedLoan = await manager.save(Loan, loan);

            const loanDetails: LoanDetail[] = [];

            for (const item of dto.items) {
                const book = await manager.findOne(Book, {
                    where: {
                        id: item.book_id,
                        is_active: true,
                    },
                });

                if (!book) {
                    throw new NotFoundException(
                        `Book with id ${item.book_id} not found`,
                    );
                }

                if (book.available_quantity < item.quantity) {
                    throw new BadRequestException(
                        `Book "${book.title}" does not have enough available quantity`,
                    );
                }

                book.available_quantity -= item.quantity;
                await manager.save(Book, book);

                const loanDetail = manager.create(LoanDetail, {
                    loan_id: savedLoan.id,
                    book_id: book.id,
                    quantity: item.quantity,
                });

                loanDetails.push(loanDetail);
            }

            await manager.save(LoanDetail, loanDetails);

            return manager.findOne(Loan, {
                where: {
                    id: savedLoan.id,
                },
                relations: {
                    user: true,
                    loan_details: {
                        book: true,
                    },
                },
            });
        });
    }

    async update(id: number, dto: UpdateLoanDto) {
        const loan = await this.findOne(id);

        if (loan.status !== LoanStatus.BORROWING) {
            throw new BadRequestException(
                'Only borrowing loans can be updated',
            );
        }

        Object.assign(loan, {
            due_date: dto.due_date ? new Date(dto.due_date) : loan.due_date,
        });

        return this.loanRepository.save(loan);
    }

    async updateStatus(id: number, dto: UpdateLoanStatusDto) {
        return this.dataSource.transaction(async manager => {
            const loan = await manager.findOne(Loan, {
                where: { id },
                relations: {
                    loan_details: {
                        book: true,
                    },
                },
            });

            if (!loan) {
                throw new NotFoundException('Loan not found');
            }

            if (loan.status === dto.status) {
                throw new BadRequestException(
                    `Loan is already ${dto.status}`,
                );
            }

            if (loan.status === LoanStatus.CANCELLED) {
                throw new BadRequestException(
                    'Cancelled loan cannot be updated',
                );
            }

            if (loan.status === LoanStatus.RETURNED) {
                throw new BadRequestException(
                    'Returned loan cannot be updated',
                );
            }

            if (dto.status === LoanStatus.BORROWING) {
                throw new BadRequestException(
                    'Cannot update loan status back to borrowing',
                );
            }

            if (
                dto.status === LoanStatus.RETURNED ||
                dto.status === LoanStatus.CANCELLED
            ) {
                for (const detail of loan.loan_details) {
                    const book = detail.book;

                    book.available_quantity += detail.quantity;

                    if (book.available_quantity > book.total_quantity) {
                        book.available_quantity = book.total_quantity;
                    }

                    await manager.save(Book, book);
                }
            }

            if (dto.status === LoanStatus.RETURNED) {
                loan.return_date = new Date();
            }

            loan.status = dto.status;

            return manager.save(Loan, loan);
        });
    }
}
