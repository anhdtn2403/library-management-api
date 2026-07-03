import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { LmsNotificationsService } from './lms-notifications.service';
import { MarkNotificationsReadDto } from './dtos/mark-notifications-read.dto';

@UseGuards(JwtAuthGuard)
@Controller('lms-notifications')
export class LmsNotificationsController {
    constructor(
        private readonly lmsNotificationsService: LmsNotificationsService,
    ) { }

    @Get('user/:userId')
    findByUser(@Param('userId') userId: string) {
        return this.lmsNotificationsService.findByUser(Number(userId));
    }

    @Patch('read')
    markManyAsRead(@Body() dto: MarkNotificationsReadDto) {
        return this.lmsNotificationsService.markAsRead(dto.ids);
    }
}
