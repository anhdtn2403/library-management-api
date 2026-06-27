import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Book } from 'src/entities/book.entity';
import { Repository } from 'typeorm';
import { CreateBookDto } from './dtos/create-book.dto';
import { UpdateBookDto } from './dtos/update-book.dto';

@Injectable()
// @Injectable() báo cho NestJS biết class này là provider, 
// có thể được inject vào Controller.
export class BooksService {
    constructor(
        @InjectRepository(Book)
        private readonly bookRepository: Repository<Book>
    ) { }

    findAll() {
        return this.bookRepository.find();
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

    create(dto: CreateBookDto) {
        if (
            dto.available_quantity !== undefined &&
            dto.total_quantity !== undefined &&
            dto.available_quantity > dto.total_quantity
        ) {
            throw new BadRequestException(
                'Available quantity cannot be greater than total quantity',
            );
        }
        const book = this.bookRepository.create(dto);
        return this.bookRepository.save(book);
    }

    async update(
        id: number,
        dto: UpdateBookDto,
    ) {
        const book = await this.findOne(id);
        Object.assign(book, dto);
        if (
            book.available_quantity !== undefined &&
            book.total_quantity !== undefined &&
            book.available_quantity > book.total_quantity
        ) {
            throw new BadRequestException(
                'Available quantity cannot be greater than total quantity',
            );
        }
        return this.bookRepository.save(book);
    }

    async remove(id: number) {
        const book = await this.findOne(id);
        this.bookRepository.delete(id);
    }
}
