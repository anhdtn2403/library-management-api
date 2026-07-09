import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "./user.entity";
import { LoanDetail } from "./loan-detail.entity";
import { LoanStatus } from "../common/enums/loan-status.enum";

@Entity('loans')
export class Loan {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    user_id!: number;

    @Column({ nullable: true })
    loan_date?: Date;

    @Column({
        type: 'enum',
        enum: LoanStatus,
        default: LoanStatus.PENDING
    })
    status!: LoanStatus; // PENDING, PENDING_PAYMENT, BORROWING, COMPLETED, CANCELLED

    @Column({ nullable: true, type: 'decimal', precision: 12, scale: 2 })
    total_initial_payment?: number; // = total_deposit + total_rental_fee

    @Column({ nullable: true, type: 'decimal', precision: 12, scale: 2 })
    total_deposit_refund?: number; // = max(total_deposit - total_fine - total_lost_fee, 0)

    @Column({ nullable: true, type: 'decimal', precision: 12, scale: 2 })
    total_extra_payment?: number; // = max(total_fine + total_lost_fee - total_deposit, 0)

    @Column({ type: 'varchar', length: 500, nullable: true })
    cancelled_reason?: string;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;

    @ManyToOne(
        () => User,
        user => user.loans
    )
    @JoinColumn({
        name: 'user_id'
    })
    user!: User;

    @OneToMany(
        () => LoanDetail,
        loan_detail => loan_detail.loan
    )
    loan_details!: LoanDetail[];
}