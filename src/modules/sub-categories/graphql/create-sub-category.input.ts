import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsString, MaxLength } from 'class-validator';

@InputType()
export class CreateSubCategoryInput {
    @Field(() => Int)
    @IsInt()
    category_id!: number;

    @Field()
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name!: string;
}