import { Field, InputType } from "@nestjs/graphql";
import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from "class-validator";

@InputType()
export class RegisterInput {
    @Field()
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(30)
    @Matches(/^[a-zA-Z0-9_]+$/, {
        message:
            'Username can only contain letters, numbers and underscore',
    })
    username!: string;

    @Field()
    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    @MaxLength(100)
    @Matches(/^[a-zA-ZÀ-ỹ\s]+$/, {
        message:
            'Full name can only contain letters and spaces',
    })
    full_name!: string;

    @Field()
    @IsEmail()
    @IsNotEmpty()
    @MaxLength(255)
    email!: string;

    @Field()
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

    // @IsEnum(UserRole)
    // role!: UserRole;
}