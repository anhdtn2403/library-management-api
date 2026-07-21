import { Field, InputType } from "@nestjs/graphql";
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from "class-validator";

@InputType()
export class ResetPasswordInput {
    @Field()
    @IsString()
    @IsNotEmpty()
    token!: string;

    @Field()
    @IsString()
    @MinLength(8)
    @MaxLength(20)
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#])[A-Za-z\d@$!%*?&.#]+$/,
        {
            message:
                'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
        },
    )
    new_password!: string;

    @Field()
    @IsString()
    @MinLength(8)
    @MaxLength(20)
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#])[A-Za-z\d@$!%*?&.#]+$/,
        {
            message:
                'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
        },
    )
    confirm_password!: string;
}