import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CancelLoanDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    cancelled_reason!: string;
}