import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsDateString, IsInt, Min, ValidateNested } from "class-validator";

export class CreateLoanDto {

    @IsInt()
    user_id!: number;

    @IsDateString()
    due_date!: string;

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => CreateLoanItemDto)
    items!: CreateLoanItemDto[];
}

class CreateLoanItemDto {
    @IsInt()
    book_id!: number;

    @IsInt()
    @Min(1)
    quantity!: number;
}
