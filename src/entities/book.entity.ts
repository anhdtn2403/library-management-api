import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { LoanDetail } from "./loan-detail.entity";
import { SubCategory } from "./sub-category.entity";
import { UserFavoriteBook } from "./user-favorite-book.entity";

@Entity('books')
export class Book {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    sub_category_id!: number;

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

    @Column({ default: 14 })
    max_borrow_days!: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    deposit_amount!: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    fine_per_day!: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    replacement_cost!: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    fee_per_day!: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    fee_per_week!: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    fee_per_month!: number;

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

    @ManyToOne(() => SubCategory, subCategory => subCategory.books, { nullable: true })
    @JoinColumn({ name: 'sub_category_id' })
    sub_category?: SubCategory;

    @OneToMany(
        () => UserFavoriteBook,
        favoriteBook => favoriteBook.book,
    )
    favorited_by_users!: UserFavoriteBook[];
}