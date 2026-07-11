import { Field, ID, ObjectType } from "@nestjs/graphql";
import { SubCategoryType } from "src/modules/sub-categories/graphql/sub-category.type";

@ObjectType()
export class CategoryType {
    @Field(() => ID)
    id!: number;

    @Field()
    name!: string;

    @Field()
    created_at!: Date;

    @Field()
    updated_at!: Date;

    @Field(() => [SubCategoryType], {
        nullable: true,
    })
    sub_categories?: SubCategoryType[];
}