import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { LoanDetail } from "./loan-detail.entity";

@Entity('returned_histories')
export class ReturnedHistory {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    loan_detail_id!: number;

    @Column({ type: 'timestamp' })
    return_date!: Date;

    @Column({ type: 'int', default: 0 })
    return_quantity!: number;

    @Column({ type: 'int', default: 0 })
    lost_quantity!: number;

    @Column({ type: 'int', default: 0 })
    late_days!: number;

    @Column({
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0,
    })
    fine_amount!: number;

    @Column({
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0,
    })
    lost_fee!: number;

    @Column({
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0,
    })
    deposit_refund_amount!: number;

    @Column({
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0,
    })
    extra_payment_amount!: number;

    @Column({
        type: 'varchar',
        length: 500,
        nullable: true,
    })
    note?: string;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;

    @ManyToOne(
        () => LoanDetail,
        detail => detail.returned_histories,
        {
            onDelete: 'CASCADE',
        },
    )
    @JoinColumn({
        name: 'loan_detail_id',
    })
    loan_detail!: LoanDetail;
}