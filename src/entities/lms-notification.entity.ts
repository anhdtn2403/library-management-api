import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { NotificationType } from '../common/enums/notification-type.enum';

@Entity('lms_ notifications')
export class LmsNotification {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    user_id!: number;

    @Column({ type: 'varchar', length: 255 })
    title!: string;

    @Column({ type: 'text' })
    message!: string;

    @Column({
        type: 'enum',
        enum: NotificationType,
    })
    type!: NotificationType;

    @Column({ default: false })
    is_read!: boolean;

    @CreateDateColumn()
    created_at!: Date;

    @ManyToOne(
        () => User,
        user => user.notifications
    )
    @JoinColumn({
        name: 'user_id'
    })
    user!: User;
}