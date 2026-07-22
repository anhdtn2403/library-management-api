import { Field, InputType } from "@nestjs/graphql";
import { IsEmail, IsNotEmpty, MaxLength } from "class-validator";

@InputType()
export class ForgotPasswordInput {
    @Field()
    @IsNotEmpty({
        message: 'Email không được để trống',
    })
    @IsEmail(
        {},
        {
            message: 'Email không đúng định dạng',
        },
    )
    @MaxLength(255, {
        message: 'Email có nhiều nhất 255 ký tự',
    })
    email!: string;
}