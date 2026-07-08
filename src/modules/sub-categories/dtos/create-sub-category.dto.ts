import { IsInt, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateSubCategoryDto {
    @IsInt()
    category_id!: number;

    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name!: string;
}