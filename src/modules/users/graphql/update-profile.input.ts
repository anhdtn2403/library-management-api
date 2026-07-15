import { Field, InputType } from "@nestjs/graphql";
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

@InputType()
export class UpdateProfileInput {
    @Field({
        nullable: true,
    })
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(255)
    full_name?: string;

    @Field({
        nullable: true,
    })
    @IsOptional()
    @IsEmail()
    @MaxLength(255)
    email?: string;
}