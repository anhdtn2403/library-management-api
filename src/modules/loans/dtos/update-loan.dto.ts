import { IsDateString, IsOptional } from 'class-validator';

export class UpdateLoanDto {
    @IsOptional()
    @IsDateString()
    due_date?: string;
}