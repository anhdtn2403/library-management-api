import { Module } from '@nestjs/common';
import { LmsNotificationsService } from './lms-notifications.service';
import { User } from 'src/entities/user.entity';
import { LmsNotification } from 'src/entities/lms-notification.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LmsNotificationsResolver } from './lms-notifications.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([LmsNotification, User])],
  providers: [LmsNotificationsService, LmsNotificationsResolver],
  exports: [LmsNotificationsService]
})
export class LmsNotificationsModule { }
