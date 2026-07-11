import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Book } from 'src/entities/book.entity';
import { LoanDetail } from 'src/entities/loan-detail.entity';
import { Loan } from 'src/entities/loan.entity';
import { User } from 'src/entities/user.entity';
import { DataSource, EntityManager, LessThan, Repository } from 'typeorm';
import { CreateLoanDto } from './dtos/create-loan.dto';
import { LoanDetailStatus, LoanStatus } from 'src/common/enums/loan-status.enum';
import { LmsNotificationsService } from '../lms-notifications/lms-notifications.service';
import { GetLoansQueryDto } from './dtos/get-loans-query.dto';
import { ReturnLoanDetailDto } from './dtos/return-loan-detail.dto';
import { CancelLoanDto } from './dtos/cancel-loan.dto';

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
                'loan.status',
                'loan.total_initial_payment',
                'loan.total_deposit_refund',
                'loan.total_extra_payment',
                'loan.cancelled_reason',

                'user.id',
                'user.full_name',
                'user.email',

                'detail.id',
                'detail.quantity',
                'detail.borrow_days',
                'detail.due_date',
                'detail.return_date',
                'detail.status',
                'detail.deposit_amount',
                'detail.rental_fee',
                'detail.fine_amount',
                'detail.lost_quantity',
                'detail.lost_fee',
                'detail.deposit_refund_amount',
                'detail.extra_payment_amount',

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

        if (query.user_id !== undefined) {
            qb.andWhere('loan.user_id = :user_id', {
                user_id: query.user_id,
            });
        }

        if (query.keyword) {
            qb.andWhere(
                `(user.full_name ILIKE :keyword 
                    OR user.email ILIKE :keyword 
                    OR user.username ILIKE :keyword)`,
                {
                    keyword: `%${query.keyword}%`,
                },
            );
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
                status: LoanStatus.PENDING,
            });
            const savedLoan = await manager.save(Loan, loan);

            const totalQuantityByBook = new Map<number, number>();
            for (const item of dto.items) {
                const currentQuantity =
                    totalQuantityByBook.get(item.book_id) ?? 0;

                totalQuantityByBook.set(
                    item.book_id,
                    currentQuantity + item.quantity,
                );
            }
            const booksById = new Map<number, Book>();
            for (const [bookId, requestedQuantity] of totalQuantityByBook) {
                const book = await manager.findOne(Book, {
                    where: {
                        id: bookId,
                        is_active: true,
                    },
                });
                if (!book) {
                    throw new NotFoundException(
                        `Book with id ${bookId} not found`,
                    );
                }
                const availableQuantity =
                    book.total_quantity - book.borrowed_quantity;
                if (requestedQuantity > availableQuantity) {
                    throw new BadRequestException(
                        `Book "${book.title}" only has ${availableQuantity} copies available, but ${requestedQuantity} copies were requested`,
                    );
                }
                booksById.set(bookId, book);
            }
            const loanDetails: LoanDetail[] = [];
            for (const item of dto.items) {
                const book = booksById.get(item.book_id)!;
                if (item.borrow_days > book.max_borrow_days) {
                    throw new BadRequestException(
                        `Book "${book.title}" can only be borrowed for max ${book.max_borrow_days} days`,
                    );
                }
                const depositAmount = Number(book.deposit_amount) * item.quantity;
                const rentalFee =
                    this.calculateRentalFee(
                        item.borrow_days,
                        Number(book.fee_per_day),
                        Number(book.fee_per_week),
                        Number(book.fee_per_month),
                    ) * item.quantity;
                const loanDetail = manager.create(LoanDetail, {
                    loan_id: savedLoan.id,
                    book_id: book.id,
                    quantity: item.quantity,
                    borrow_days: item.borrow_days,
                    status: LoanDetailStatus.PENDING,
                    deposit_amount: depositAmount,
                    rental_fee: rentalFee,
                    book_fine_per_day: Number(book.fine_per_day),
                    book_replacement_cost: Number(book.replacement_cost),
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

    async confirmLoan(id: number) {
        return this.dataSource.transaction(async manager => {
            const loan = await manager.findOne(Loan, {
                where: { id },
                relations: {
                    loan_details: true,
                },
            });
            if (!loan) throw new NotFoundException('Loan not found');
            if (loan.status !== LoanStatus.PENDING) {
                throw new BadRequestException('Only PENDING loan can be confirmed');
            }

            const loanDate: Date = new Date();
            loan.status = LoanStatus.PENDING_PAYMENT;
            loan.loan_date = loanDate;
            for (const detail of loan.loan_details) {
                const dueDate: Date = new Date(loanDate);
                dueDate.setDate(dueDate.getDate() + detail.borrow_days);
                detail.due_date = dueDate;
                await manager.save(LoanDetail, detail);
            }
            await manager.save(Loan, loan);
        });
    }

    async payAndBorrow(id: number) {
        return this.dataSource.transaction(async manager => {
            const loan = await manager.findOne(Loan, {
                where: { id },
                relations: {
                    loan_details: true,
                },
            });
            if (!loan) {
                throw new NotFoundException('Loan not found');
            }
            if (loan.status !== LoanStatus.PENDING_PAYMENT) {
                throw new BadRequestException(
                    'Only PENDING_PAYMENT loan can be paid',
                );
            }

            const quantityByBook = new Map<number, number>();
            for (const detail of loan.loan_details) {
                quantityByBook.set(
                    detail.book_id,
                    (quantityByBook.get(detail.book_id) ?? 0)
                    + detail.quantity,
                );
            }

            // Khóa từng dòng book trong transaction để tránh
            // hai request thanh toán cùng lúc cùng lấy một lượng tồn kho.
            for (const [bookId, requestedQuantity] of quantityByBook) {
                const book = await manager.findOne(Book, {
                    where: {
                        id: bookId,
                        is_active: true,
                    },
                    lock: {
                        mode: 'pessimistic_write',
                    },
                });
                if (!book) {
                    throw new NotFoundException(
                        `Book with id ${bookId} not found or inactive`,
                    );
                }
                const availableQuantity =
                    book.total_quantity - book.borrowed_quantity;
                if (requestedQuantity > availableQuantity) {
                    throw new BadRequestException(
                        `Book "${book.title}" only has ` +
                        `${availableQuantity} copies available, ` +
                        `but ${requestedQuantity} copies were requested`,
                    );
                }
                book.borrowed_quantity += requestedQuantity;
                await manager.save(Book, book);
            }

            let totalDeposit = 0;
            let totalRentalFee = 0;
            for (const detail of loan.loan_details) {
                detail.status = LoanDetailStatus.BORROWING;
                totalDeposit += Number(detail.deposit_amount);
                totalRentalFee += Number(detail.rental_fee);
            }
            await manager.save(LoanDetail, loan.loan_details);

            loan.status = LoanStatus.BORROWING;
            loan.total_initial_payment =
                totalDeposit + totalRentalFee;
            await manager.save(Loan, loan);
        });
    }

    async returnLoanDetail(detailId: number, dto: ReturnLoanDetailDto) {
        return this.dataSource.transaction(async manager => {
            const detail = await manager.findOne(LoanDetail, {
                where: { id: detailId },
                relations: {
                    loan: {
                        loan_details: true,
                    },
                    book: true,
                },
            });
            if (!detail) throw new NotFoundException('Loan detail not found');
            if (![LoanDetailStatus.BORROWING, LoanDetailStatus.OVERDUE].includes(detail.status)) {
                throw new BadRequestException(
                    'Only BORROWING or OVERDUE detail can be returned',
                );
            }
            if (dto.lost_quantity > detail.quantity) {
                throw new BadRequestException(
                    'Lost quantity cannot be greater than borrowed quantity',
                );
            }

            const now = new Date();
            detail.return_date = now;
            if (!detail.due_date) {
                throw new BadRequestException(
                    'Loan detail does not have due date',
                );
            }
            const dueDate = detail.due_date;
            const lateDays = Math.max(
                Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)),
                0,
            );

            detail.status = LoanDetailStatus.RETURNED;
            detail.fine_amount = lateDays * Number(detail.book_fine_per_day) * detail.quantity;
            detail.lost_quantity = dto.lost_quantity;
            detail.lost_fee = Number(detail.book_replacement_cost) * detail.lost_quantity;
            detail.deposit_refund_amount = Math.max(
                Number(detail.deposit_amount) - detail.fine_amount - detail.lost_fee,
                0,
            );
            detail.extra_payment_amount = Math.max(
                detail.fine_amount + detail.lost_fee - Number(detail.deposit_amount),
                0,
            );
            detail.book.borrowed_quantity = Math.max(
                detail.book.borrowed_quantity - detail.quantity,
                0,
            );
            detail.book.total_quantity = Math.max(
                detail.book.total_quantity - detail.lost_quantity,
                0,
            );

            await manager.save(Book, detail.book);
            await manager.save(LoanDetail, detail);
            await this.recalculateLoanAfterReturn(detail.loan_id, manager);
        });
    }

    async cancelLoan(id: number, dto: CancelLoanDto) {
        return this.dataSource.transaction(async manager => {
            const loan = await manager.findOne(Loan, {
                where: { id },
                relations: {
                    loan_details: true,
                },
            });
            if (!loan) {
                throw new NotFoundException('Loan not found');
            }
            if (![LoanStatus.PENDING, LoanStatus.PENDING_PAYMENT].includes(loan.status)) {
                throw new BadRequestException(
                    'Only PENDING or PENDING_PAYMENT loan can be cancelled',
                );
            }

            loan.status = LoanStatus.CANCELLED;
            loan.cancelled_reason = dto.cancelled_reason;
            for (const detail of loan.loan_details) {
                detail.status = LoanDetailStatus.CANCELLED;
                await manager.save(LoanDetail, detail);
            }
            await manager.save(Loan, loan);
        });
    }

    async markOverdueLoans() {
        return this.dataSource.transaction(async manager => {
            const now = new Date();
            const overdueDetails = await manager.find(LoanDetail, {
                where: {
                    status: LoanDetailStatus.BORROWING,
                    due_date: LessThan(now),
                },
                relations: {
                    loan: true,
                    book: true,
                },
            });
            const notifiedLoanIds = new Set<number>();
            for (const detail of overdueDetails) {
                detail.status = LoanDetailStatus.OVERDUE;
                await manager.save(LoanDetail, detail);
                if (!notifiedLoanIds.has(detail.loan_id)) {
                    await this.lmsNotificationsService.createOverdueNotification(
                        detail.loan.user_id,
                        detail.loan_id,
                        manager,
                    );

                    notifiedLoanIds.add(detail.loan_id);
                }
            }
            return {
                total: overdueDetails.length,
                message: 'Overdue loan details checked successfully',
            };
        });
    }

    private mapLoanResponse(loan: Loan) {
        const details = loan.loan_details ?? [];
        const totalDeposit = details.reduce((sum, d) => sum + Number(d.deposit_amount || 0), 0);
        const totalRentalFee = details.reduce((sum, d) => sum + Number(d.rental_fee || 0), 0);
        const totalFine = details.reduce((sum, d) => sum + Number(d.fine_amount || 0), 0);
        const totalLostFee = details.reduce((sum, d) => sum + Number(d.lost_fee || 0), 0);
        return {
            id: loan.id,
            loan_date: loan.loan_date,
            status: loan.status,
            cancelled_reason: loan.cancelled_reason,

            total_deposit: totalDeposit,
            total_rental_fee: totalRentalFee,
            total_amount: totalDeposit + totalRentalFee,
            total_fine: totalFine,
            total_lost_fee: totalLostFee,

            total_initial_payment: loan.total_initial_payment,
            total_deposit_refund: loan.total_deposit_refund,
            total_extra_payment: loan.total_extra_payment,

            borrower: loan.user
                ? {
                    user_id: loan.user.id,
                    full_name: loan.user.full_name,
                    email: loan.user.email,
                }
                : null,

            books: details.map(detail => ({
                loan_detail_id: detail.id,
                book_id: detail.book.id,
                title: detail.book.title,
                author: detail.book.author,
                image_url: detail.book.image_url,

                quantity: detail.quantity,
                borrow_days: detail.borrow_days,
                due_date: detail.due_date,
                return_date: detail.return_date,
                status: detail.status,

                deposit_amount: Number(detail.deposit_amount),
                rental_fee: Number(detail.rental_fee),
                fine_amount: Number(detail.fine_amount || 0),
                lost_quantity: Number(detail.lost_quantity || 0),
                lost_fee: Number(detail.lost_fee || 0),
                deposit_refund_amount: Number(detail.deposit_refund_amount || 0),
                extra_payment_amount: Number(detail.extra_payment_amount || 0),
            }))
        };
    }
    private calculateRentalFee(
        borrowDays: number,
        feePerDay: number,
        feePerWeek: number,
        feePerMonth: number,
    ) {
        const months = Math.floor(borrowDays / 30);
        let remainingDays = borrowDays % 30;

        const weeks = Math.floor(remainingDays / 7);
        remainingDays = remainingDays % 7;

        return months * feePerMonth + weeks * feePerWeek + remainingDays * feePerDay;
    }

    private async recalculateLoanAfterReturn(loanId: number, manager: EntityManager) {
        const loan = await manager.findOne(Loan, {
            where: { id: loanId },
            relations: {
                loan_details: true,
            },
        });
        if (!loan) return;
        const details = loan.loan_details;
        loan.total_deposit_refund = details.reduce(
            (sum, detail) =>
                sum + Number(detail.deposit_refund_amount || 0),
            0,
        );
        loan.total_extra_payment = details.reduce(
            (sum, detail) =>
                sum + Number(detail.extra_payment_amount || 0),
            0,
        );

        if (details.every(d => d.status === LoanDetailStatus.RETURNED)) {
            loan.status = LoanStatus.COMPLETED;
        }
        await manager.save(Loan, loan);
    }
}
