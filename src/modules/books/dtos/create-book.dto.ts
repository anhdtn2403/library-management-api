import { IsBoolean, IsInt, IsISBN, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateBookDto {
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
}