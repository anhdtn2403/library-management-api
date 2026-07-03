import { Module } from '@nestjs/common';
import { LmsNotificationsController } from './lms-notifications.controller';
import { LmsNotificationsService } from './lms-notifications.service';
import { User } from 'src/entities/user.entity';
import { LmsNotification } from 'src/entities/lms-notification.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([LmsNotification, User])],
  controllers: [LmsNotificationsController],
  providers: [LmsNotificationsService],
  exports: [LmsNotificationsService]
})
export class LmsNotificationsModule { }
