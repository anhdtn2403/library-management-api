import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Loan } from "./loan.entity";
import { Book } from "./book.entity";
import { LoanDetailStatus } from "../common/enums/loan-status.enum";

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
    return_date?: Date;

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

    @Column({ nullable: true, type: 'decimal', precision: 12, scale: 2 })
    fine_amount?: number; // tiền phạt do trả trễ = book_fine_per_day × quantity × days_late

    @Column({ nullable: true })
    lost_quantity?: number;

    @Column({ nullable: true, type: 'decimal', precision: 12, scale: 2 })
    lost_fee?: number; // tiền đền nếu mất sách = book_replacement_cost × lost_quantity

    @Column({ nullable: true, type: 'decimal', precision: 12, scale: 2 })
    deposit_refund_amount?: number; // = max(deposit_amount - fine_amount - lost_fee, 0)

    @Column({ nullable: true, type: 'decimal', precision: 12, scale: 2 })
    extra_payment_amount?: number; // = max(fine_amount + lost_fee - deposit_amount, 0)

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
}