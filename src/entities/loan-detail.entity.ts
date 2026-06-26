import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Loan } from "./loan.entity";
import { Book } from "./book.entity";

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