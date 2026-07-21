import { Field, InputType } from "@nestjs/graphql";
import { IsEmail, IsNotEmpty, MaxLength } from "class-validator";

@InputType()
export class ForgotPasswordInput {
    @Field()
    @IsEmail()
    @IsNotEmpty()
    @MaxLength(255)
    email!: string;
}