import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Book } from 'src/entities/book.entity';
import { LoanDetail } from 'src/entities/loan-detail.entity';
import { Loan } from 'src/entities/loan.entity';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import { DashboardFilterInput } from './graphql/dashboard-filter.input';
import { UserRole } from 'src/common/enums/user-role.enum';
import { LoanDetailStatus, LoanStatus } from 'src/common/enums/loan-status.enum';
interface DateRange {
    fromDate?: Date;
    toDate?: Date;
}
@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(Book)
        private readonly bookRepository: Repository<Book>,

        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        @InjectRepository(Loan)
        private readonly loanRepository: Repository<Loan>,

        @InjectRepository(LoanDetail)
        private readonly loanDetailRepository: Repository<LoanDetail>,
    ) { }

    async getSummary(input?: DashboardFilterInput) {
        const { fromDate, toDate } = this.parseDateRange(input);
        const bookSummary = await this.bookRepository
            .createQueryBuilder('book')
            .select('COUNT(book.id)', 'total_book_titles')
            .addSelect(
                'COALESCE(SUM(book.total_quantity), 0)',
                'total_book_copies',
            )
            .addSelect(
                'COALESCE(SUM(book.borrowed_quantity), 0)',
                'borrowed_book_copies',
            )
            .addSelect(
                `COALESCE(SUM(book.total_quantity - book.borrowed_quantity), 0)`,
                'available_book_copies',
            )
            .where('book.is_active = true')
            .getRawOne();
        const totalMembers = await this.userRepository.count({
            where: {
                role: UserRole.MEMBER,
                is_active: true,
            },
        });
        const loanStatusQuery = this.loanRepository
            .createQueryBuilder('loan')
            .select('loan.status', 'status')
            .addSelect('COUNT(loan.id)', 'count')
            .groupBy('loan.status');
        this.applyLoanDateFilter(
            loanStatusQuery,
            fromDate,
            toDate,
        );
        const loanStatuses = await loanStatusQuery.getRawMany();
        const statusMap = new Map<LoanStatus, number>();
        for (const item of loanStatuses) {
            statusMap.set(
                item.status as LoanStatus,
                Number(item.count),
            );
        }
        const overdueQuery = this.loanDetailRepository
            .createQueryBuilder('detail')
            .where('detail.status = :status', {
                status: LoanDetailStatus.OVERDUE,
            })
            .andWhere(`detail.quantity - detail.returned_quantity - detail.lost_quantity > 0`);
        if (fromDate) {
            overdueQuery.andWhere(
                'detail.due_date >= :fromDate',
                { fromDate },
            );
        }
        if (toDate) {
            overdueQuery.andWhere(
                'detail.due_date < :toDate',
                { toDate },
            );
        }
        const overdueDetails = await overdueQuery.getCount();
        const financialQuery = this.loanDetailRepository
            .createQueryBuilder('detail')
            .innerJoin('detail.loan', 'loan')
            .select(
                'COALESCE(SUM(detail.rental_fee), 0)',
                'rental_revenue',
            )
            .addSelect(
                'COALESCE(SUM(detail.fine_amount), 0)',
                'fine_revenue',
            )
            .addSelect(
                'COALESCE(SUM(detail.lost_fee), 0)',
                'lost_book_revenue',
            )
            .where('loan.status != :cancelledStatus', {
                cancelledStatus: LoanStatus.CANCELLED,
            });
        this.applyLoanDateFilter(
            financialQuery,
            fromDate,
            toDate,
        );
        const financial = await financialQuery.getRawOne();
        const holdingDepositQuery = this.loanDetailRepository
            .createQueryBuilder('detail')
            .innerJoin('detail.loan', 'loan')
            .select(
                `COALESCE(SUM(detail.deposit_amount - detail.deposit_refund_amount),0 ) `,
                'holding_deposit',
            )
            .where('loan.status IN (:...statuses)', {
                statuses: [
                    LoanStatus.BORROWING,
                    LoanStatus.COMPLETED,
                ],
            });
        const holdingDeposit = await holdingDepositQuery.getRawOne();
        const rentalRevenue = Number(financial?.rental_revenue ?? 0);
        const fineRevenue = Number(financial?.fine_revenue ?? 0);
        const lostBookRevenue = Number(financial?.lost_book_revenue ?? 0);

        return {
            total_book_titles: Number(bookSummary?.total_book_titles ?? 0),
            total_book_copies: Number(bookSummary?.total_book_copies ?? 0),
            borrowed_book_copies: Number(bookSummary?.borrowed_book_copies ?? 0),
            available_book_copies: Number(bookSummary?.available_book_copies ?? 0),
            total_members: totalMembers,
            pending_loans: statusMap.get(LoanStatus.PENDING) ?? 0,
            pending_payment_loans: statusMap.get(LoanStatus.PENDING_PAYMENT) ?? 0,
            borrowing_loans: statusMap.get(LoanStatus.BORROWING) ?? 0,
            completed_loans: statusMap.get(LoanStatus.COMPLETED) ?? 0,
            cancelled_loans: statusMap.get(LoanStatus.CANCELLED) ?? 0,
            overdue_details: overdueDetails,
            rental_revenue: rentalRevenue,
            fine_revenue: fineRevenue,
            lost_book_revenue: lostBookRevenue,
            total_revenue: rentalRevenue + fineRevenue + lostBookRevenue,
            holding_deposit: Math.max(Number(holdingDeposit?.holding_deposit ?? 0,), 0,),
        };
    }

    async getLoanStatusStatistics(
        input?: DashboardFilterInput,
    ) {
        const { fromDate, toDate } =
            this.parseDateRange(input);

        const query = this.loanRepository
            .createQueryBuilder('loan')
            .select('loan.status', 'status')
            .addSelect('COUNT(loan.id)', 'count')
            .groupBy('loan.status')
            .orderBy('loan.status', 'ASC');

        this.applyLoanDateFilter(query, fromDate, toDate);

        const rows = await query.getRawMany();

        const statusMap = new Map<LoanStatus, number>();

        for (const row of rows) {
            statusMap.set(
                row.status as LoanStatus,
                Number(row.count),
            );
        }

        return Object.values(LoanStatus).map(status => ({
            status,
            count: statusMap.get(status) ?? 0,
        }));
    }

    async getTopBorrowedBooks(
        limit = 5,
        input?: DashboardFilterInput,
    ) {
        const { fromDate, toDate } =
            this.parseDateRange(input);

        const query = this.loanDetailRepository
            .createQueryBuilder('detail')
            .innerJoin('detail.book', 'book')
            .innerJoin('detail.loan', 'loan')
            .select('book.id', 'book_id')
            .addSelect('book.title', 'title')
            .addSelect('book.author', 'author')
            .addSelect('book.image_url', 'image_url')
            .addSelect(
                'COALESCE(SUM(detail.quantity), 0)',
                'borrowed_quantity',
            )
            .where('loan.status != :cancelledStatus', {
                cancelledStatus: LoanStatus.CANCELLED,
            })
            .groupBy('book.id')
            .addGroupBy('book.title')
            .addGroupBy('book.author')
            .addGroupBy('book.image_url')
            .orderBy(
                'COALESCE(SUM(detail.quantity), 0)',
                'DESC',
            )
            .limit(limit);

        this.applyLoanDateFilter(
            query,
            fromDate,
            toDate,
        );

        const rows = await query.getRawMany();

        return rows.map(row => ({
            book_id: Number(row.book_id),
            title: row.title,
            author: row.author,
            image_url: row.image_url,
            borrowed_quantity:
                Number(row.borrowed_quantity),
        }));
    }

    private parseDateRange(input?: DashboardFilterInput,): DateRange {
        let fromDate: Date | undefined;
        let toDate: Date | undefined;
        if (input?.from_date) {
            fromDate = new Date(`${input.from_date}T00:00:00.000Z`,);
        }
        if (input?.to_date) {
            const endDate = new Date(`${input.to_date}T00:00:00.000Z`,);
            endDate.setUTCDate(endDate.getUTCDate() + 1);
            toDate = endDate;
        }
        if (fromDate && toDate && fromDate >= toDate) {
            throw new BadRequestException('Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc',);
        }
        return { fromDate, toDate };
    }

    private applyLoanDateFilter(query: any, fromDate?: Date, toDate?: Date) {
        //PENDING loan có thể chưa có loan_date,
        // nên dùng created_at để thống kê thời điểm tạo phiếu.
        if (fromDate) {
            query.andWhere('loan.created_at >= :fromDate', { fromDate });
        }
        if (toDate) {
            query.andWhere('loan.created_at < :toDate', { toDate });
        }
    }
}
