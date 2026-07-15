import { Field, InputType } from "@nestjs/graphql";
import { IsBoolean } from "class-validator";

@InputType()
export class UpdateUserStatusInput {
    @Field()
    @IsBoolean()
    is_active!: boolean;
}