import { Field, InputType, Int } from "@nestjs/graphql";
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { UserRole } from "src/common/enums/user-role.enum";

@InputType()
export class GetUsersInput {
    @Field(() => Int, {
        nullable: true,
        defaultValue: 1,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    page?: number = 1;

    @Field(() => Int, {
        nullable: true,
        defaultValue: 10,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    pageSize?: number = 10;

    @Field({
        nullable: true,
    })
    @IsOptional()
    @IsString()
    keyword?: string;

    @Field(() => UserRole, {
        nullable: true,
    })
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;

    @Field({
        nullable: true,
    })
    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
}