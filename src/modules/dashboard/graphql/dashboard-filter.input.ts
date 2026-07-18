import { Field, InputType } from "@nestjs/graphql";
import { IsDateString, IsOptional } from "class-validator";

@InputType()
export class DashboardFilterInput {
    @Field({ nullable: true })
    @IsOptional()
    @IsDateString()
    from_date?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsDateString()
    to_date?: string;
}