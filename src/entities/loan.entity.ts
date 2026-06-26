import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";
import { LoanDetail } from "./loan-detail.entity";
import { LoanStatus } from "../common/enums/loan-status.enum";

@Entity('loans')
export class Loan {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    user_id!: number;

    @Column()
    loan_date!: Date;

    @Column()
    due_date!: Date;

    @Column({ nullable: true })
    return_date?: Date;

    @Column({
        type: 'enum',
        enum: LoanStatus
    })
    status!: LoanStatus; // BORROWING, RETURNED, OVERDUE

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