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
                        `Book with title "${item.book_id}" not found`,
                    );
                }
                if (item.borrow_days > book.max_borrow_days) {
                    throw new BadRequestException(
                        `Book "${book.title}" can only be borrowed for max ${book.max_borrow_days} days`,
                    );
                }
                if (book.total_quantity - book.borrowed_quantity < item.quantity) {
                    throw new BadRequestException(
                        `Book "${book.title}" does not have enough available quantity`,
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
            return this.findOne(savedLoan.id);
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
            return this.findOne(id);
        });
    }

    async payAndBorrow(id: number) {
        return this.dataSource.transaction(async manager => {
            const loan = await manager.findOne(Loan, {
                where: { id },
                relations: {
                    loan_details: {
                        book: true,
                    },
                },
            });
            if (!loan) throw new NotFoundException('Loan not found');
            if (loan.status !== LoanStatus.PENDING_PAYMENT) {
                throw new BadRequestException('Only PENDING_PAYMENT loan can be paid');
            }

            let totalDeposit = 0;
            let totalRentalFee = 0;
            for (const detail of loan.loan_details) {
                const book = detail.book;
                const availableQuantity = book.total_quantity - book.borrowed_quantity;
                if (availableQuantity < detail.quantity) {
                    throw new BadRequestException(
                        `Book "${book.title}" does not have enough available quantity`,
                    );
                }
                book.borrowed_quantity += detail.quantity;
                await manager.save(Book, book);

                detail.status = LoanDetailStatus.BORROWING;
                await manager.save(LoanDetail, detail);

                totalDeposit += Number(detail.deposit_amount);
                totalRentalFee += Number(detail.rental_fee);
            }

            loan.status = LoanStatus.BORROWING;
            loan.total_initial_payment = totalDeposit + totalRentalFee;
            await manager.save(Loan, loan);
            return this.findOne(id);
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
            if (dto.quantity_lost > detail.quantity) {
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
            detail.lost_fee = Number(detail.book_replacement_cost) * dto.quantity_lost;
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
                detail.book.total_quantity - dto.quantity_lost,
                0,
            );

            await manager.save(Book, detail.book);
            await manager.save(LoanDetail, detail);
            await this.recalculateLoanAfterReturn(detail.loan_id, manager);
            return this.findOne(detail.loan_id);
        });
    }

    async cancelLoan(id: number) {
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
            for (const detail of loan.loan_details) {
                detail.status = LoanDetailStatus.CANCELLED;
                await manager.save(LoanDetail, detail);
            }

            await manager.save(Loan, loan);
            return this.findOne(id);
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
        const totalDeposit = details.reduce((sum, d) => sum + Number(d.deposit_amount), 0);
        const totalFine = details.reduce((sum, d) => sum + Number(d.fine_amount || 0), 0);
        const totalLostFee = details.reduce((sum, d) => sum + Number(d.lost_fee || 0), 0);

        loan.total_deposit_refund = Math.max(totalDeposit - totalFine - totalLostFee, 0);
        loan.total_extra_payment = Math.max(totalFine + totalLostFee - totalDeposit, 0);

        if (details.every(d => d.status === LoanDetailStatus.RETURNED)) {
            loan.status = LoanStatus.COMPLETED;
        }
        await manager.save(Loan, loan);
    }
}
