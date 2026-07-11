
import { UseGuards } from "@nestjs/common";
import { BookType } from "./graphql/book.type";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { PermissionsGuard } from "src/common/guards/permissions.guard";
import { Args, ID, Mutation, Query, Resolver } from "@nestjs/graphql";
import { BooksService } from "./books.service";
import { BooksPageType } from "./graphql/books-page.type";
import { RequirePermissions } from "src/common/decorators/permission.decorator";
import { UserPermission } from "src/common/enums/user-permission.enum";
import { GetBooksInput } from "./graphql/get-books.input";
import { CreateBookInput } from "./graphql/create-book.input";
import { UpdateBookInput } from "./graphql/update-book.input";

@Resolver(() => BookType)
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BooksResolver {
    constructor(private readonly booksService: BooksService) {}

    @Query(() => BooksPageType, {
        name: 'books',
    })
    @RequirePermissions(UserPermission.BOOK_VIEW)
    findAll(
        @Args('query', {
            type: () => GetBooksInput,
            nullable: true,
        })
        query?: GetBooksInput,
    ) {
        return this.booksService.findAll(query ?? new GetBooksInput());
    }

    @Query(() => BookType, {
        name: 'book',
    })
    @RequirePermissions(UserPermission.BOOK_VIEW)
    findOne(
        @Args('id', { type: () => ID })
        id: number,
    ) {
        return this.booksService.findOne(Number(id));
    }

    @Mutation(() => BookType)
    @RequirePermissions(UserPermission.BOOK_CREATE)
    createBook(
        @Args('input')
        input: CreateBookInput,
    ) {
        return this.booksService.create(input);
    }

    @Mutation(() => BookType)
    @RequirePermissions(UserPermission.BOOK_UPDATE)
    updateBook(
        @Args('id', { type: () => ID })
        id: number,

        @Args('input')
        input: UpdateBookInput,
    ) {
        return this.booksService.update(Number(id), input);
    }

    @Mutation(() => Boolean)
    @RequirePermissions(UserPermission.BOOK_DELETE)
    async deleteBook(
        @Args('id', { type: () => ID })
        id: number,
    ) {
        await this.booksService.remove(Number(id));
        return true;
    }
}