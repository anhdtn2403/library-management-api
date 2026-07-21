import { Args, ID, Mutation, Query, Resolver } from "@nestjs/graphql";
import { UserType } from "./graphql/user.type";
import { UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { UsersService } from "./users.service";
import { UserFavoriteBooksService } from "./user-favorite-books.service";
import { CurrentUser, type CurrentUserData } from "src/common/decorators/current-user.decorator";
import { UpdateProfileInput } from "./graphql/update-profile.input";
import { BooksPageType } from "../books/graphql/books-page.type";
import { GetFavoriteBooksInput } from "./graphql/get-favorite-books.input";
import { UploadScalar } from "src/common/graphql/upload.scalar";
import { FileUpload } from "src/common/graphql/file-upload.type";
import { MessageType } from "../auths/graphql/message.type";
import { ChangePasswordInput } from "./graphql/change-password.input";

@Resolver(() => UserType)
@UseGuards(JwtAuthGuard)
export class MyAccountResolver {
    constructor(
        private readonly usersService: UsersService,
        private readonly favoriteBooksService: UserFavoriteBooksService,
    ) { }

    @Query(() => UserType, { name: 'me' })
    getMyProfile(
        @CurrentUser() currentUser: CurrentUserData
    ) {
        return this.usersService.getMyProfile(currentUser.userId);
    }

    @Mutation(() => UserType)
    updateMyProfile(
        @CurrentUser() currentUser: CurrentUserData,
        @Args('input') input: UpdateProfileInput
    ) {
        return this.usersService.updateMyProfile(currentUser.userId, input);
    }

    @Mutation(() => UserType)
    updateMyAvatar(
        @CurrentUser() currentUser: CurrentUserData,
        @Args('image', { type: () => UploadScalar }) image: unknown
    ) {
        return this.usersService.uploadAvatar(currentUser.userId, image as Promise<FileUpload>,);
    }

    @Mutation(() => MessageType)
    changeMyPassword(
        @CurrentUser() currentUser: CurrentUserData,
        @Args('input') input: ChangePasswordInput
    ) {
        return this.usersService.changeMyPassword(
            currentUser.userId,
            input.current_password,
            input.new_password,
            input.confirm_password,
        );
    }

    @Query(() => BooksPageType, { name: 'myFavoriteBooks' })
    getMyFavoriteBooks(
        @CurrentUser() currentUser: CurrentUserData,
        @Args('query', { type: () => GetFavoriteBooksInput, nullable: true }) query?: GetFavoriteBooksInput,
    ) {
        return this.favoriteBooksService.findAll(
            currentUser.userId,
            query ?? new GetFavoriteBooksInput(),
        );
    }

    @Query(() => Boolean, { name: 'isMyFavoriteBook', })
    isMyFavoriteBook(
        @CurrentUser() currentUser: CurrentUserData,
        @Args('bookId', { type: () => ID }) bookId: number,
    ) {
        return this.favoriteBooksService.isFavorite(currentUser.userId, Number(bookId));
    }

    @Mutation(() => Boolean)
    addMyFavoriteBook(
        @CurrentUser() currentUser: CurrentUserData,
        @Args('bookId', { type: () => ID }) bookId: number
    ) {
        return this.favoriteBooksService.add(currentUser.userId, Number(bookId));
    }

    @Mutation(() => Boolean)
    removeMyFavoriteBook(
        @CurrentUser() currentUser: CurrentUserData,
        @Args('bookId', { type: () => ID }) bookId: number
    ) {
        return this.favoriteBooksService.remove(currentUser.userId, Number(bookId));
    }
}