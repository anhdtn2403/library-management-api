
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
import { FileUpload } from "src/common/graphql/file-upload.type";
import { UploadScalar } from "src/common/graphql/upload.scalar";

@Resolver(() => BookType)
export class BooksResolver {
    constructor(private readonly booksService: BooksService) { }

    @Query(() => BooksPageType, {
        name: 'books',
    })
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
    findOne(
        @Args('id', { type: () => ID })
        id: number,
    ) {
        return this.booksService.findOne(Number(id));
    }

    @Mutation(() => BookType)
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(UserPermission.BOOK_CREATE)
    createBook(
        @Args('input')
        input: CreateBookInput,
    ) {
        return this.booksService.create(input);
    }

    @Mutation(() => BookType)
    @UseGuards(JwtAuthGuard, PermissionsGuard)
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
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(UserPermission.BOOK_DELETE)
    async deleteBook(
        @Args('id', { type: () => ID })
        id: number,
    ) {
        await this.booksService.remove(Number(id));
        return true;
    }

    @Mutation(() => BookType)
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(UserPermission.BOOK_UPDATE)
    updateBookImage(
        @Args('id', { type: () => ID }) id: number,
        @Args('image', { type: () => UploadScalar }) image: unknown,
    ) {
        return this.booksService.uploadImage(Number(id), image as Promise<FileUpload>);
    }
}