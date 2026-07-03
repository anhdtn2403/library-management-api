import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min, Max } from 'class-validator';
import { LoanStatus } from 'src/common/enums/loan-status.enum';

export class GetLoansQueryDto {
    @IsOptional()
    @IsEnum(LoanStatus)
    status?: LoanStatus;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    pageSize: number = 10;
} 