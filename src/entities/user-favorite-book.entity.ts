import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { User } from "./user.entity";
import { Book } from "./book.entity";

@Entity('user_favorite_books')
export class UserFavoriteBook {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    user_id!: number;

    @Column()
    book_id!: number;

    @CreateDateColumn()
    created_at!: Date;

    @ManyToOne(
        () => User,
        user => user.favorite_books,
        {
            onDelete: 'CASCADE',
        },
    )
    @JoinColumn({
        name: 'user_id',
    })
    user!: User;

    @ManyToOne(
        () => Book,
        book => book.favorited_by_users,
        {
            onDelete: 'CASCADE',
        },
    )
    @JoinColumn({
        name: 'book_id',
    })
    book!: Book;
}