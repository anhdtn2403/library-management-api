// src/modules/sub-categories/graphql/sub-category.type.ts

import { Field, ID, ObjectType } from '@nestjs/graphql';
import { CategoryType } from '../../categories/graphql/category.type';

@ObjectType()
export class SubCategoryType {
    @Field(() => ID)
    id!: number;

    @Field(() => ID)
    category_id!: number;

    @Field()
    name!: string;

    @Field()
    created_at!: Date;

    @Field()
    updated_at!: Date;

    @Field(() => CategoryType, { nullable: true })
    category?: CategoryType;
}