import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Book } from "src/entities/book.entity";
import { UserFavoriteBook } from "src/entities/user-favorite-book.entity";
import { Repository } from "typeorm";
import { GetFavoriteBooksInput } from "./graphql/get-favorite-books.input";

@Injectable()
export class UserFavoriteBooksService {
    constructor(
        @InjectRepository(UserFavoriteBook)
        private readonly favoriteRepository:
            Repository<UserFavoriteBook>,

        @InjectRepository(Book)
        private readonly bookRepository:
            Repository<Book>,
    ) { }

    async findAll(
        userId: number,
        query: GetFavoriteBooksInput,
    ) {
        const pageNumber = query.page ?? 1;
        const pageSize = query.pageSize ?? 10;

        const qb = this.favoriteRepository
            .createQueryBuilder('favorite')
            .innerJoinAndSelect(
                'favorite.book',
                'book',
            )
            .leftJoinAndSelect(
                'book.sub_category',
                'subCategory',
            )
            .leftJoinAndSelect(
                'subCategory.category',
                'category',
            )
            .where(
                'favorite.user_id = :userId',
                {
                    userId,
                },
            )
            .andWhere(
                'book.is_active = true',
            );

        if (query.keyword?.trim()) {
            qb.andWhere(
                `(
                    book.title ILIKE :keyword
                    OR book.isbn ILIKE :keyword
                    OR book.author ILIKE :keyword
                )`,
                {
                    keyword:
                        `%${query.keyword.trim()}%`,
                },
            );
        }

        qb.orderBy(
            'favorite.created_at',
            'DESC',
        );

        qb.skip(
            (pageNumber - 1) * pageSize,
        );

        qb.take(pageSize);

        const [favorites, totalItems] =
            await qb.getManyAndCount();

        return {
            pageNumber,
            pageSize,
            totalItems,
            totalPages: Math.ceil(
                totalItems / pageSize,
            ),
            items: favorites.map(
                favorite => favorite.book,
            ),
        };
    }

    async isFavorite(
        userId: number,
        bookId: number,
    ): Promise<boolean> {
        const favorite =
            await this.favoriteRepository.findOneBy({
                user_id: userId,
                book_id: bookId,
            });

        return Boolean(favorite);
    }

    async add(
        userId: number,
        bookId: number,
    ): Promise<boolean> {
        const book =
            await this.bookRepository.findOneBy({
                id: bookId,
            });

        if (!book) {
            throw new NotFoundException(
                'Book not found',
            );
        }

        if (!book.is_active) {
            throw new BadRequestException(
                'Inactive book cannot be added to favorites',
            );
        }

        const existing =
            await this.favoriteRepository.findOneBy({
                user_id: userId,
                book_id: bookId,
            });

        if (existing) {
            return true;
        }

        const favorite =
            this.favoriteRepository.create({
                user_id: userId,
                book_id: bookId,
            });

        await this.favoriteRepository.save(
            favorite,
        );

        return true;
    }

    async remove(
        userId: number,
        bookId: number,
    ): Promise<boolean> {
        await this.favoriteRepository.delete({
            user_id: userId,
            book_id: bookId,
        });

        return true;
    }
}