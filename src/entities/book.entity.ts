import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { LoanDetail } from "./loan-detail.entity";

@Entity('books')
export class Book {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar', length: 255 })
    title!: string;

    @Column({ type: 'varchar', length: 50, nullable: true, unique: true })
    isbn?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    author?: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    image_url?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    publisher?: string;

    @Column({ nullable: true })
    publisher_year?: number;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ default: 0 })
    total_quantity!: number;

    @Column({ default: 0 })
    borrowed_quantity!: number;

    @Column({ default: true })
    is_active!: boolean;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;

    @OneToMany(
        () => LoanDetail,
        loan_detail => loan_detail.book
    )
    loan_details!: LoanDetail[];
}