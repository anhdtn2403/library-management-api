import { IsEnum, IsInt, IsOptional, Min } from "class-validator";
export class ReturnLoanDetailDto {
    @IsInt()
    @Min(0)
    quantity_lost!: number;;
}