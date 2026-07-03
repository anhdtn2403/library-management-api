import { IsEmail, IsEnum, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from "class-validator";
import { UserRole } from "src/common/enums/user-role.enum";

export class RegisterDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(30)
    @Matches(/^[a-zA-Z0-9_]+$/, {
        message:
            'Username can only contain letters, numbers and underscore',
    })
    username!: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    @MaxLength(100)
    @Matches(/^[a-zA-ZÀ-ỹ\s]+$/, {
        message:
            'Full name can only contain letters and spaces',
    })
    full_name!: string;

    @IsEmail()
    @IsNotEmpty()
    @MaxLength(255)
    email!: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    @MaxLength(20)
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#])[A-Za-z\d@$!%*?&.#]+$/,
        {
            message:
                'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
        },
    )
    password!: string;

    @IsEnum(UserRole)
    role!: UserRole;
}