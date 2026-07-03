import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Loan } from "./loan.entity";
import { UserRole } from "../common/enums/user-role.enum";
import { LmsNotification } from "./lms-notification.entity";

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
    notifications!: Notification[];
}