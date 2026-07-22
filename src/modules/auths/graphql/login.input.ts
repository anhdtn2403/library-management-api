import { Field, InputType } from "@nestjs/graphql";
import { IsNotEmpty, IsString, MinLength } from "class-validator";

@InputType()
export class LoginInput {
    @Field()
    @IsString()
    @IsNotEmpty({
        message: 'Tên đăng nhập không được để trống'
    })
    username!: string;

    @Field()
    @IsString()
    @IsNotEmpty({
        message: 'Mật khẩu không được để trống'
    })
    @MinLength(6)
    password!: string;
}