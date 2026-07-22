import { Field, InputType } from "@nestjs/graphql";
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from "class-validator";

@InputType()
export class ChangePasswordInput {
    @Field()
    @IsString()
    @IsNotEmpty({
        message: 'Mật khẩu không được để trống',
    })
    current_password!: string;

    @Field()
    @IsString()
    @IsNotEmpty({
        message: 'Mật khẩu không được để trống',
    })
    @MinLength(8, {
        message: 'Mật khẩu phải có ít nhất 8 ký tự',
    })
    @MaxLength(20, {
        message: 'Mật khẩu nhiều nhất có 20 ký tự',
    })
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/,
        {
            message:
                'Mật khẩu phải có ít nhất một chữ hoa, một chữ thường, một chữ số và một ký tự đặc biệt',
        },
    )
    new_password!: string;

    @Field()
    @IsString()
    @IsNotEmpty({
        message: 'Mật khẩu không được để trống',
    })
    @MinLength(8, {
        message: 'Mật khẩu phải có ít nhất 8 ký tự',
    })
    @MaxLength(20, {
        message: 'Mật khẩu nhiều nhất có 20 ký tự',
    })
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/,
        {
            message:
                'Mật khẩu phải có ít nhất một chữ hoa, một chữ thường, một chữ số và một ký tự đặc biệt',
        },
    )
    confirm_password!: string;
}