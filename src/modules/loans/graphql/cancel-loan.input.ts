import {
    Field,
    InputType,
} from '@nestjs/graphql';
import {
    IsNotEmpty,
    IsString,
    MaxLength,
} from 'class-validator';

@InputType()
export class CancelLoanInput {
    @Field()
    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    cancelled_reason!: string;
}