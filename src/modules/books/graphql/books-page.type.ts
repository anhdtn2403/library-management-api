import { Field, Int, ObjectType } from "@nestjs/graphql";
import { BookType } from "./book.type";

@ObjectType()
export class BooksPageType {
    @Field(() => Int)
    pageNumber!: number;

    @Field(() => Int)
    pageSize!: number;

    @Field(() => Int)
    totalItems!: number;

    @Field(() => Int)
    totalPages!: number;

    @Field(() => [BookType])
    items!: BookType[];
}