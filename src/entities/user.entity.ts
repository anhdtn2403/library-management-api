import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Loan } from "./loan.entity";
import { UserRole } from "../common/enums/user-role.enum";
import { LmsNotification } from "./lms-notification.entity";
import { UserFavoriteBook } from "./user-favorite-book.entity";

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar', length: 255, unique: true })
    username!: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    email!: string;

    @Column({ type: 'varchar', length: 255 })
    password_hash!: string;

    @Column({ type: 'varchar', length: 255 })
    full_name!: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    avatar?: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.MEMBER
    })
    role!: UserRole; // Admin/Librarian/Member

    @Column({ default: true })
    is_active!: boolean;

    @Column({
        type: 'boolean',
        default: false,
    })
    is_email_verified!: boolean;

    @Column({
        type: 'varchar',
        length: 64,
        nullable: true,
        select: false
        // TypeORM sẽ không tự lấy hai field nhạy cảm này trong các truy vấn thông thường như repository.findOneBy(...), repository.find(...)
        // Khi cần kiểm tra token, bạn phải chủ động thêm: .addSelect(...)
        // Điều này giảm nguy cơ vô tình trả token hash qua GraphQL.
    })
    email_verification_token_hash?: string | null;

    @Column({
        type: 'timestamp',
        nullable: true,
        select: false,
    })
    email_verification_expires_at?: Date | null;

    @Column({
        type: 'varchar',
        length: 64,
        nullable: true,
        select: false,
    })
    password_reset_token_hash?: string | null;

    @Column({
        type: 'timestamp',
        nullable: true,
        select: false,
    })
    password_reset_expires_at?: Date | null;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;

    @OneToMany(
        () => Loan,
        loan => loan.user
    )
    loans!: Loan[];

    @OneToMany(
        () => LmsNotification,
        notification => notification.user
    )
    notifications!: LmsNotification[];

    @OneToMany(
        () => UserFavoriteBook,
        favoriteBook => favoriteBook.user,
    )
    favorite_books!: UserFavoriteBook[];
}