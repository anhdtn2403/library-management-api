import { Field, InputType } from "@nestjs/graphql";
import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from "class-validator";

@InputType()
export class RegisterInput {
    @Field()
    @IsString()
    @IsNotEmpty({
        message: 'Tên đăng nhập không được để trống',
    })
    @MinLength(3, {
        message:
            'Tên đăng nhập phải có ít nhất 3 ký tự',
    })
    @MaxLength(30, {
        message: 'Tên đăng nhập có nhiều nhất 30 ký tự',
    })
    @Matches(/^[a-zA-Z0-9_]+$/, {
        message:
            'Username can only contain letters, numbers and underscore',
    })
    username!: string;

    @Field()
    @IsString()
    @IsNotEmpty({
        message: 'Họ và tên không được để trống',
    })
    @MinLength(2, {
        message: 'Họ và tên phải có ít nhất 2 ký tự',
    })
    @MaxLength(100, {
        message: 'Họ và tên có nhiều nhất 100 ký tự',
    })
    @Matches(/^[a-zA-ZÀ-ỹ\s]+$/, {
        message:
            'Họ và tên chỉ gồm các ký tự chữ và khoảng cách',
    })
    full_name!: string;

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
    password!: string;

    // @IsEnum(UserRole)
    // role!: UserRole;
}