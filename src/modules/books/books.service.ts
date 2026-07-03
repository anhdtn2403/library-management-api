import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Book } from 'src/entities/book.entity';
import { Not, Repository } from 'typeorm';
import { CreateBookDto } from './dtos/create-book.dto';
import { UpdateBookDto } from './dtos/update-book.dto';
import { GetBooksQueryDto } from './dtos/get-books-query.dto';

@Injectable()
// @Injectable() báo cho NestJS biết class này là provider, 
// có thể được inject vào Controller.
export class BooksService {
    constructor(
        @InjectRepository(Book)
        private readonly bookRepository: Repository<Book>
    ) { }

    async findAll(query: GetBooksQueryDto) {
        const pageNumber = query.page || 1;
        const pageSize = query.pageSize || 10;
        const qb = this.bookRepository
            .createQueryBuilder('book') // Tạo một query builder cho entity Book, đặt alias là 'book'
            .select([
                'book.id',
                'book.title',
                'book.isbn',
                'book.author',
                'book.image_url',
                'book.publisher',
                'book.publisher_year',
                'book.total_quantity',
                'book.borrowed_quantity',
                'book.is_active',
            ]);

        if (query.keyword) {
            qb.andWhere(
                '(book.title ILIKE :keyword OR book.isbn ILIKE :keyword)',
                { keyword: `%${query.keyword}%` });
        }
        if (query.author) {
            qb.andWhere(
                'book.author ILIKE :author',
                { author: `%${query.author}%` });
        }
        if (query.is_active !== undefined) {
            qb.andWhere(
                'book.is_active = :is_active',
                { is_active: query.is_active });
        }
        if (query.available === true) {
            qb.andWhere('book.total_quantity - book.borrowed_quantity > 0');
        }

        if (query.available === false) {
            qb.andWhere('book.total_quantity - book.borrowed_quantity = 0');
        }
        qb.orderBy('book.id', 'DESC');
        qb.skip((pageNumber - 1) * pageSize);
        qb.take(pageSize);
        const [items, totalItems] = await qb.getManyAndCount();
        return {
            pageNumber,
            pageSize,
            totalItems,
            totalPages: Math.ceil(totalItems / pageSize),
            items,
        };
    }

    async findOne(id: number) {
        const book = await this.bookRepository.findOneBy({
            id,
        });
        if (!book) {
            throw new NotFoundException('Book not found');
        }
        return book;
    }

    async create(dto: CreateBookDto) {
        if (dto.isbn) {
            const existingBook = await this.bookRepository.findOne({
                where: {
                    isbn: dto.isbn
                },
            });

            if (existingBook) {
                throw new BadRequestException('ISBN already exists');
            }
        }
        const book = this.bookRepository.create(dto);
        if (book.borrowed_quantity > book.total_quantity) {
            throw new BadRequestException(
                'Borrowed quantity cannot be greater than total quantity',
            );
        }
        return this.bookRepository.save(book);
    }

    async update(
        id: number,
        dto: UpdateBookDto,
    ) {
        if (dto.isbn) {
            const existingBook = await this.bookRepository.findOne({
                where: {
                    isbn: dto.isbn,
                    id: Not(id),
                },
            });

            if (existingBook) {
                throw new BadRequestException('ISBN already exists');
            }
        }
        const book = await this.findOne(id);
        Object.assign(book, dto);
        if (book.borrowed_quantity > book.total_quantity) {
            throw new BadRequestException(
                'Borrowed quantity cannot be greater than total quantity',
            );
        }
        return this.bookRepository.save(book);
    }

    async remove(id: number) {
        const book = await this.findOne(id);
        //this.bookRepository.delete(id); -> ko xóa cứng, vì có thể có lịch sử mượn sách trước đó
        // xóa mềm -> Book ko cho mượn nữa, lưu lịch sử mượn trước đó
        book.is_active = false;
        this.bookRepository.save(book);
    }
}
