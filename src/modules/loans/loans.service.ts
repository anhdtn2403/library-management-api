import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Book } from 'src/entities/book.entity';
import { LoanDetail } from 'src/entities/loan-detail.entity';
import { Loan } from 'src/entities/loan.entity';
import { User } from 'src/entities/user.entity';
import { DataSource, EntityManager, LessThan, Repository } from 'typeorm';
import { LoanDetailStatus, LoanStatus } from 'src/common/enums/loan-status.enum';
import { LmsNotificationsService } from '../lms-notifications/lms-notifications.service';
import { ReturnedHistory } from 'src/entities/returned-history.entity';
import { GetLoansInput } from './graphql/get-loans.input';
import { CreateLoanInput } from './graphql/create-loan.input';
import { ReturnDetailInput } from './graphql/return-detail.input';
import { CancelLoanInput } from './graphql/cancel-loan.input';
import { type CurrentUserData } from 'src/common/decorators/current-user.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';

@Injectable()
export class LoansService {
    constructor(
        @InjectRepository(Loan)
        private readonly loanRepository: Repository<Loan>,
        private readonly dataSource: DataSource,
        private readonly lmsNotificationsService: LmsNotificationsService,
    ) { }

    async findAll(currentUser: CurrentUserData, query: GetLoansInput) {
        const pageNumber = query.page || 1;
        const pageSize = query.pageSize || 10;

        const qb = this.loanRepository
            .createQueryBuilder('loan')
            .leftJoinAndSelect('loan.user', 'user')
            .leftJoinAndSelect('loan.loan_details', 'detail')
            .leftJoinAndSelect('detail.book', 'book')
            .leftJoinAndSelect('detail.returned_histories', 'returnedHistory');
        if (currentUser.role === UserRole.MEMBER) {
            qb.andWhere(
                'loan.user_id = :currentUserId',
                {
                    currentUserId:
                        currentUser.userId,
                },
            );
        }
        else if (query.user_id !== undefined) {
            qb.andWhere(
                'loan.user_id = :userId',
                {
                    userId: query.user_id,
                },
            );
        }

        if (query.status) {
            qb.andWhere('loan.status = :status', {
                status: query.status,
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

    async findOne(currentUser: CurrentUserData, id: number) {
        const qb = this.loanRepository
            .createQueryBuilder('loan')
            .leftJoinAndSelect('loan.user', 'user')
            .leftJoinAndSelect('loan.loan_details', 'detail')
            .leftJoinAndSelect('detail.book', 'book')
            .leftJoinAndSelect('detail.returned_histories', 'returnedHistory')
            .where('loan.id = :id', { id });
        if (currentUser.role === UserRole.MEMBER) {
            qb.andWhere(
                'loan.user_id = :currentUserId',
                {
                    currentUserId: currentUser.userId,
                },
            );
        }
        const loan = await qb.getOne();
        if (!loan) {
            throw new NotFoundException('Không tìm thấy phiếu mượn');
        }
        return this.mapLoanResponse(loan);
    }

    async create(userId: number, dto: CreateLoanInput) {
        return this.dataSource.transaction(async manager => {
            const user = await manager.findOne(User, {
                where: {
                    id: userId,
                    is_active: true,
                },
            });
            if (!user) {
                throw new NotFoundException('Không tìm thấy người dùng');
            }

            const loan = manager.create(Loan, {
                user_id: userId,
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
                        `Không tìm thấy sách có ID ${bookId} hoặc sách đã ngừng hoạt động`,
                    );
                }
                const availableQuantity =
                    book.total_quantity - book.borrowed_quantity;
                if (requestedQuantity > availableQuantity) {
                    throw new BadRequestException(
                        `Sách "${book.title}" chỉ còn ${availableQuantity} quyển, không đủ cho số lượng yêu cầu là ${requestedQuantity}`,
                    );
                }
                booksById.set(bookId, book);
            }
            const loanDetails: LoanDetail[] = [];
            for (const item of dto.items) {
                const book = booksById.get(item.book_id)!;
                if (item.borrow_days > book.max_borrow_days) {
                    throw new BadRequestException(
                        `Sách "${book.title}" chỉ được mượn tối đa ${book.max_borrow_days} ngày`,
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
                        returned_histories: true
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
            if (!loan) throw new NotFoundException('Không tìm thấy phiếu mượn');
            if (loan.status !== LoanStatus.PENDING) {
                throw new BadRequestException('Chỉ có thể xác nhận phiếu mượn đang chờ xử lý');
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
                throw new NotFoundException('Không tìm thấy phiếu mượn');
            }
            if (loan.status !== LoanStatus.PENDING_PAYMENT) {
                throw new BadRequestException(
                    'Chỉ có thể thanh toán và bàn giao sách cho phiếu mượn đang chờ thanh toán',
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
                        `Không tìm thấy sách có ID ${bookId} hoặc sách đã ngừng hoạt động`,
                    );
                }
                const availableQuantity =
                    book.total_quantity - book.borrowed_quantity;
                if (requestedQuantity > availableQuantity) {
                    throw new BadRequestException(
                        `Sách "${book.title}" chỉ còn ${availableQuantity} quyển, không đủ cho số lượng yêu cầu là ${requestedQuantity}`
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

    async returnLoanDetail(detailId: number, dto: ReturnDetailInput) {
        return this.dataSource.transaction(async manager => {
            const detail = await manager
                .createQueryBuilder(LoanDetail, 'detail')
                .setLock('pessimistic_write')
                .where('detail.id = :detailId', { detailId })
                .getOne();

            if (!detail) {
                throw new NotFoundException('Không tìm thấy chi tiết phiếu mượn');
            }
            const book = await manager.findOne(Book, {
                where: { id: detail.book_id },
            });
            if (!book) {
                throw new NotFoundException('Không tìm thấy sách');
            }
            if (![LoanDetailStatus.BORROWING, LoanDetailStatus.OVERDUE].includes(detail.status)) {
                throw new BadRequestException(
                    'Chỉ có thể trả sách đang được mượn hoặc đã quá hạn',
                );
            }

            const returnQuantity = dto.return_quantity;
            const lostQuantity = dto.lost_quantity;
            const processedQuantity = returnQuantity + lostQuantity;
            if (processedQuantity <= 0) {
                throw new BadRequestException(
                    'Số lượng trả hoặc số lượng mất phải lớn hơn 0',
                );
            }

            const currentReturnedQuantity = Number(detail.returned_quantity || 0);
            const currentLostQuantity = Number(detail.lost_quantity || 0);
            const remainingQuantity = detail.quantity
                - currentReturnedQuantity - currentLostQuantity;
            if (processedQuantity > remainingQuantity) {
                throw new BadRequestException(
                    `Tổng số lượng trả và mất vượt quá số lượng còn lại. Chỉ còn ${remainingQuantity} quyển sách chưa được xử lý`,
                );
            }
            if (detail.quantity <= 0) {
                throw new BadRequestException(
                    'Số lượng trong chi tiết phiếu mượn không hợp lệ',
                );
            }
            if (!detail.due_date) {
                throw new BadRequestException(
                    'Chi tiết phiếu mượn chưa có hạn trả sách',
                );
            }
            const now = new Date();
            const lateDays = Math.max(
                Math.ceil((now.getTime() - detail.due_date.getTime()) / (1000 * 60 * 60 * 24)),
                0,
            );

            const fineAmount = lateDays * Number(detail.book_fine_per_day || 0) * processedQuantity;
            const lostFee = Number(detail.book_replacement_cost || 0) * lostQuantity;
            const depositPerBook = Number(detail.deposit_amount || 0) / detail.quantity;
            const depositForThisReturn = depositPerBook * processedQuantity;
            const depositRefundAmount = Math.max(depositForThisReturn - fineAmount - lostFee, 0);
            const extraPaymentAmount = Math.max(fineAmount + lostFee - depositForThisReturn, 0);

            const returnedHistory = manager.create(
                ReturnedHistory,
                {
                    loan_detail_id: detail.id,
                    return_date: now,
                    return_quantity: returnQuantity,
                    lost_quantity: lostQuantity,
                    late_days: lateDays,
                    fine_amount: fineAmount,
                    lost_fee: lostFee,
                    deposit_refund_amount:
                        depositRefundAmount,
                    extra_payment_amount:
                        extraPaymentAmount,
                    note: dto.note,
                },
            );
            await manager.save(ReturnedHistory, returnedHistory);

            detail.returned_quantity = currentReturnedQuantity + returnQuantity;
            detail.lost_quantity = currentLostQuantity + lostQuantity;
            detail.fine_amount = Number(detail.fine_amount || 0) + fineAmount;
            detail.lost_fee = Number(detail.lost_fee || 0) + lostFee;
            detail.deposit_refund_amount = Number(detail.deposit_refund_amount || 0) + depositRefundAmount;
            detail.extra_payment_amount = Number(detail.extra_payment_amount || 0) + extraPaymentAmount;
            if (detail.returned_quantity + detail.lost_quantity === detail.quantity) {
                detail.status = LoanDetailStatus.RETURNED;
                detail.completed_at = now;
            }
            else if (now.getTime() > detail.due_date.getTime()) {
                detail.status = LoanDetailStatus.OVERDUE;
            }
            else {
                detail.status = LoanDetailStatus.BORROWING;
            }
            await manager.save(LoanDetail, detail);

            book.borrowed_quantity = Math.max(book.borrowed_quantity - processedQuantity, 0);
            book.total_quantity = Math.max(book.total_quantity - lostQuantity, 0);
            await manager.save(Book, book);

            await this.recalculateLoanAfterReturn(detail.loan_id, manager);
        });
    }

    async cancelLoan(id: number, input: CancelLoanInput, currentUser: CurrentUserData) {
        return this.dataSource.transaction(async manager => {
            const qb = manager.getRepository(Loan)
                .createQueryBuilder('loan')
                .leftJoinAndSelect('loan.loan_details', 'detail')
                .where('loan.id = :id', { id });

            if (currentUser.role === UserRole.MEMBER) {
                qb.andWhere(
                    'loan.user_id = :userId',
                    {
                        userId: currentUser.userId,
                    },
                );
            }
            const loan = await qb.getOne();
            if (!loan) {
                throw new NotFoundException('Không tìm thấy phiếu mượn');
            }
            if (![LoanStatus.PENDING, LoanStatus.PENDING_PAYMENT].includes(loan.status)) {
                throw new BadRequestException(
                    'Chỉ có thể hủy phiếu mượn đang chờ xử lý hoặc chờ thanh toán',
                );
            }
            loan.status = LoanStatus.CANCELLED;
            loan.cancelled_reason = input.cancelled_reason.trim();
            for (const detail of loan.loan_details) {
                detail.status = LoanDetailStatus.CANCELLED;
            }
            await manager.save(LoanDetail, loan.loan_details);
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
                message: `Đã cập nhật ${overdueDetails.length} chi tiết mượn sách quá hạn`
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
                completed_at: detail.completed_at,
                status: detail.status,

                deposit_amount: Number(detail.deposit_amount),
                rental_fee: Number(detail.rental_fee),
                fine_amount: Number(detail.fine_amount || 0),
                returned_quantity: Number(detail.returned_quantity || 0),
                lost_quantity: Number(detail.lost_quantity || 0),
                lost_fee: Number(detail.lost_fee || 0),
                deposit_refund_amount: Number(detail.deposit_refund_amount || 0),
                extra_payment_amount: Number(detail.extra_payment_amount || 0),
                remaining_quantity: detail.quantity
                    - Number(detail.returned_quantity || 0,)
                    - Number(detail.lost_quantity || 0,),
                returned_histories: detail.returned_histories?.map(
                    history => ({
                        id: history.id,
                        return_date: history.return_date,
                        return_quantity: history.return_quantity,
                        lost_quantity: history.lost_quantity,
                        late_days: history.late_days,
                        fine_amount: Number(history.fine_amount),
                        lost_fee: Number(history.lost_fee),
                        deposit_refund_amount: Number(history.deposit_refund_amount),
                        extra_payment_amount: Number(history.extra_payment_amount),
                        note: history.note,
                    }),
                ) ?? [],
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
