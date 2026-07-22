import { Field, InputType } from "@nestjs/graphql";
import { IsNotEmpty, IsString } from "class-validator";

@InputType()
export class RefreshInput {
    @Field()
    @IsString()
    @IsNotEmpty({
        message: 'Token không được để trống',
    })
    refresh_token!: string;
}