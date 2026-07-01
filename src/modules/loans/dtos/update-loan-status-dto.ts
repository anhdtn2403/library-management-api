import { IsEnum } from 'class-validator';
import { LoanStatus } from 'src/common/enums/loan-status.enum';

export class UpdateLoanStatusDto {
    @IsEnum(LoanStatus)
    status!: LoanStatus;
}