import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { LoansService } from './loans.service';

@Injectable()
export class LoansCronService {
    constructor(private readonly loansService: LoansService) { }

    //@Cron('0 0 * * *') // This cron job runs every day at midnight
    @Cron('*/30 * * * * *') // This cron job runs every 30 seconds for testing purposes
    async checkOverdueLoans() {
        await this.loansService.markOverdueLoans();
    }
}