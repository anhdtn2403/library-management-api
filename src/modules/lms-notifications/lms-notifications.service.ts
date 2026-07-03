import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationType } from 'src/common/enums/notification-type.enum';
import { LmsNotification } from 'src/entities/lms-notification.entity';
import { In, Repository } from 'typeorm';

@Injectable()
// This decorator makes the service injectable into other components like controllers or other services. 
// It allows NestJS to manage the lifecycle of the service and inject it where needed.
export class LmsNotificationsService {
    constructor(
        @InjectRepository(LmsNotification)
        private readonly repo: Repository<LmsNotification>
    ) { }

    createOverdueNotification(userId: number, loanId: number) {
        const notification = this.repo.create({
            user_id: userId,
            title: 'Phiếu mượn quá hạn',
            message: `Phiếu mượn #${loanId} của bạn đã quá hạn trả sách.`,
            type: NotificationType.LOAN_OVERDUE,
            is_read: false,
        });
        return this.repo.save(notification);
    }

    findByUser(userId: number) {
        return this.repo.find({
            where: {
                user_id: userId,
            },
            order: {
                created_at: 'DESC',
            },
        });
    }

    async markAsRead(ids: number[]) {
        await this.repo.update(
            {
                id: In(ids),
            },
            {
                is_read: true,
            },
        );

        return {
            message: 'Notifications marked as read',
            ids,
        };
    }

}
