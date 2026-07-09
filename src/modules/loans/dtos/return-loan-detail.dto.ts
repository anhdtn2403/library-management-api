import { IsInt, Min } from "class-validator";
export class ReturnLoanDetailDto {
    @IsInt()
    @Min(0)
    lost_quantity!: number;;
}