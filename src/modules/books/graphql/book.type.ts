import { Field, Float, ID, Int, ObjectType } from "@nestjs/graphql";
import { SubCategoryType } from "src/modules/sub-categories/graphql/sub-category.type";

@ObjectType()
export class BookType {
    @Field(() => ID)
    id!: number;

    @Field(() => ID)
    sub_category_id!: number;

    @Field()
    title!: string;

    @Field({ nullable: true })
    isbn?: string;

    @Field({ nullable: true })
    author?: string;

    @Field({ nullable: true })
    image_url?: string;

    @Field({ nullable: true })
    publisher?: string;

    @Field(() => Int, { nullable: true })
    publisher_year?: number;

    @Field({ nullable: true })
    description?: string;

    @Field(() => Int)
    total_quantity!: number;

    @Field(() => Int)
    borrowed_quantity!: number;

    @Field(() => Int)
    max_borrow_days!: number;

    @Field(() => Float)
    deposit_amount!: number;

    @Field(() => Float)
    fine_per_day!: number;

    @Field(() => Float)
    replacement_cost!: number;

    @Field(() => Float)
    fee_per_day!: number;

    @Field(() => Float)
    fee_per_week!: number;

    @Field(() => Float)
    fee_per_month!: number;

    @Field()
    is_active!: boolean;

    @Field()
    created_at!: Date;

    @Field()
    updated_at!: Date;

    @Field(() => SubCategoryType, {
        nullable: true,
    })
    sub_category?: SubCategoryType;
}