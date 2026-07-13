import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Loan } from "./loan.entity";
import { Book } from "./book.entity";
import { LoanDetailStatus } from "../common/enums/loan-status.enum";
import { ReturnedHistory } from "./returned-history.entity";

@Entity('loan_details')
export class LoanDetail {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    loan_id!: number;

    @Column()
    book_id!: number;

    @Column()
    quantity!: number;

    @Column()
    borrow_days!: number;

    @Column({ nullable: true })
    due_date?: Date;

    @Column({ nullable: true })
    completed_at?: Date;

    @Column({
        type: 'enum',
        enum: LoanDetailStatus,
        default: LoanDetailStatus.PENDING,
    })
    status!: LoanDetailStatus;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    deposit_amount!: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    rental_fee!: number;

    @Column({ default: 0, type: 'decimal', precision: 12, scale: 2 })
    fine_amount!: number; // Tổng tiền phạt trễ của tất cả lần xử lý trả sách

    @Column({ type: 'int', default: 0 })
    returned_quantity!: number;

    @Column({ type: 'int', default: 0 })
    lost_quantity!: number;

    @Column({ default: 0, type: 'decimal', precision: 12, scale: 2 })
    lost_fee!: number; // Tổng phí mất sách của tất cả lần xử lý

    @Column({ default: 0, type: 'decimal', precision: 12, scale: 2 })
    deposit_refund_amount!: number; // Tổng tiền cọc đã hoàn qua các lần trả

    @Column({ default: 0, type: 'decimal', precision: 12, scale: 2 })
    extra_payment_amount!: number; // Tổng tiền khách phải trả thêm qua các lần trả

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    book_fine_per_day!: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    book_replacement_cost!: number;

    @ManyToOne(
        () => Loan,
        loan => loan.loan_details
    )
    @JoinColumn({
        name: 'loan_id'
    })
    loan!: Loan;

    @ManyToOne(
        () => Book,
        book => book.loan_details
    )
    @JoinColumn({
        name: 'book_id'
    })
    book!: Book;

    @OneToMany(
        () => ReturnedHistory,
        history => history.loan_detail,
    )
    returned_histories!: ReturnedHistory[];
}