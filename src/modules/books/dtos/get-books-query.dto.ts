import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

const ToBoolean = () =>
    Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    });

export class GetBooksQueryDto {
    @IsOptional()
    @IsString()
    keyword?: string;

    @IsOptional()
    @IsString()
    author?: string;

    @IsOptional()
    @ToBoolean()
    @IsBoolean()
    is_active?: boolean;

    @IsOptional()
    @ToBoolean()
    @IsBoolean()
    available?: boolean;

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