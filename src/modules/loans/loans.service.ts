import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Book } from 'src/entities/book.entity';
import { LoanDetail } from 'src/entities/loan-detail.entity';
import { Loan } from 'src/entities/loan.entity';
import { User } from 'src/entities/user.entity';
import { DataSource, LessThan, Repository } from 'typeorm';
import { CreateLoanDto } from './dtos/create-loan.dto';
import { LoanStatus } from 'src/common/enums/loan-status.enum';
import { UpdateLoanDto } from './dtos/update-loan.dto';
import { UpdateLoanStatusDto } from './dtos/update-loan-status-dto';
import { LmsNotificationsService } from '../lms-notifications/lms-notifications.service';
import { GetLoansQueryDto } from './dtos/get-loans-query.dto';

@Injectable()
export class LoansService {
    constructor(
        @InjectRepository(Loan)
        private readonly loanRepository: Repository<Loan>,
        private readonly dataSource: DataSource,
        private readonly lmsNotificationsService: LmsNotificationsService,
    ) { }

    async findAll(query: GetLoansQueryDto) {
        const pageNumber = query.page || 1;
        const pageSize = query.pageSize || 10;

        const qb = this.loanRepository
            .createQueryBuilder('loan')
            .leftJoinAndSelect('loan.user', 'user')
            .leftJoinAndSelect('loan.loan_details', 'detail')
            .leftJoinAndSelect('detail.book', 'book')
            .select([
                'loan.id',
                'loan.loan_date',
                'loan.due_date',
                'loan.return_date',
                'loan.status',

                'user.id',
                'user.full_name',
                'user.email',

                'detail.id',
                'detail.quantity',

                'book.id',
                'book.title',
                'book.author',
                'book.image_url',
            ]);

        if (query.status) {
            qb.andWhere('loan.status = :status', {
                status: query.status,
            });
        }

        qb.orderBy('loan.id', 'DESC');

        qb.skip((pageNumber - 1) * pageSize);
        qb.take(pageSize);

        const [loans, totalItems] = await qb.getManyAndCount();

        const items = loans.map(loan => this.mapLoanResponse(loan));

        return {
            pageNumber,
            pageSize,
            totalItems,
            totalPages: Math.ceil(totalItems / pageSize),
            items,
        };
    }

    async findOne(id: number) {
        const loan = await this.loanRepository
            .findOne({
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

        return this.mapLoanResponse(loan);
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

                if (book.total_quantity - book.borrowed_quantity < item.quantity) {
                    throw new BadRequestException(
                        `Book "${book.title}" does not have enough available quantity`,
                    );
                }

                book.borrowed_quantity += item.quantity;
                await manager.save(Book, book);

                const loanDetail = manager.create(LoanDetail, {
                    loan_id: savedLoan.id,
                    book_id: book.id,
                    quantity: item.quantity,
                });

                loanDetails.push(loanDetail);
            }

            await manager.save(LoanDetail, loanDetails);

            const createdLoan = await manager.findOne(Loan, {
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
            return this.mapLoanResponse(createdLoan!);
        });
    }

    async update(id: number, dto: UpdateLoanDto) {
        const loan = await this.loanRepository.findOne({
            where: { id }
        });
        if (!loan) {
            throw new NotFoundException('Loan not found');
        }

        if (loan.status !== LoanStatus.BORROWING) {
            throw new BadRequestException(
                'Only borrowing loans can be updated',
            );
        }

        Object.assign(loan, {
            due_date: dto.due_date ? new Date(dto.due_date) : loan.due_date,
        });

        await this.loanRepository.save(loan);
        return this.findOne(id);
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
            if (loan.status === LoanStatus.OVERDUE && dto.status === LoanStatus.CANCELLED) {
                throw new BadRequestException(
                    'Overdue loan cannot be cancelled',
                );
            }
            if (
                dto.status === LoanStatus.RETURNED ||
                dto.status === LoanStatus.CANCELLED
            ) {
                for (const detail of loan.loan_details) {
                    const book = detail.book;
                    book.borrowed_quantity -= detail.quantity;
                    if (book.borrowed_quantity < 0) {
                        book.borrowed_quantity = 0;
                    }
                    await manager.save(Book, book);
                }
            }
            if (dto.status === LoanStatus.RETURNED) {
                loan.return_date = new Date();
            }
            loan.status = dto.status;
            await manager.save(Loan, loan);

            const updatedLoan = await manager.findOne(
                Loan,
                {
                    where: { id },
                    relations: {
                        user: true,
                        loan_details: {
                            book: true
                        }
                    }
                }
            );
            return this.mapLoanResponse(updatedLoan!);
        });
    }

    async markOverdueLoans() {
        return this.dataSource.transaction(async manager => {
            const now = new Date();
            const loans = await manager.find(Loan, {
                where: {
                    status: LoanStatus.BORROWING,
                    due_date: LessThan(now),
                },
            });
            for (const loan of loans) {
                loan.status = LoanStatus.OVERDUE;
                await manager.save(Loan, loan);
                await this.lmsNotificationsService.createOverdueNotification(
                    loan.user_id,
                    loan.id,
                    manager,
                );
            }
            return {
                total: loans.length,
                message: 'Overdue loans checked successfully',
            };
        });
    }

    private mapLoanResponse(loan: Loan) {
        return {
            id: loan.id,
            loan_date: loan.loan_date,
            due_date: loan.due_date,
            return_date: loan.return_date,
            status: loan.status,

            borrower: loan.user
                ? {
                    user_id: loan.user.id,
                    full_name: loan.user.full_name,
                    email: loan.user.email,
                }
                : null,

            books: loan.loan_details?.map(detail => ({
                book_id: detail.book.id,
                title: detail.book.title,
                author: detail.book.author,
                image_url: detail.book.image_url,
                quantity: detail.quantity,
            })) ?? [],
        };
    }
}
