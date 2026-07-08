import { IsBoolean, IsInt, IsISBN, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateBookDto {
    @IsInt()
    sub_category_id!: number;

    @IsString()
    @IsNotEmpty()
    title!: string;

    @IsOptional()
    @IsISBN('13')
    isbn?: string;

    @IsOptional()
    @IsString()
    author?: string;

    @IsOptional()
    @IsString()
    image_url?: string;

    @IsOptional()
    @IsString()
    publisher?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    publisher_year?: number;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    total_quantity?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    max_borrow_days?: number;

    @IsOptional()
    @Min(0)
    deposit_amount?: number;

    @IsOptional()
    @Min(0)
    fine_per_day?: number;

    @IsOptional()
    @Min(0)
    replacement_cost?: number;

    @IsOptional()
    @Min(0)
    fee_per_day?: number;

    @IsOptional()
    @Min(0)
    fee_per_week?: number;

    @IsOptional()
    @Min(0)
    fee_per_month?: number;
}