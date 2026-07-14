import { Field, InputType } from "@nestjs/graphql";
import { IsNotEmpty, IsString, MinLength } from "class-validator";

@InputType()
export class LoginInput {
    @Field()
    @IsString()
    @IsNotEmpty()
    username!: string;

    @Field()
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password!: string;
}