import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { BooksService } from './books.service';
import { UserRole } from 'src/common/enums/user-role.enum';
import { CreateBookDto } from './dtos/create-book.dto';
import { UpdateBookDto } from './dtos/update-book.dto';

@Controller('books')
export class BooksController {
    constructor(
        private readonly booksService: BooksService
    ) { }

    @Get() // GET http://localhost:3000/books
    findAll() {
        return this.booksService.findAll();
    }

    @Get(':id') // GET http://localhost:3000/books/1
    findOne(@Param('id') id: string) {
        return this.booksService.findOne(Number(id));
    }

    @Post() // POST http://localhost:3000/books
    create(@Body() dto: CreateBookDto) {
        return this.booksService.create(dto);
    }

    @Put(':id') // PUT http://localhost:3000/books/1
    update(@Param('id') id: string, @Body() dto: UpdateBookDto) {
        return this.booksService.update(
            Number(id),
            dto,
        );
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.booksService.remove(
            Number(id),
        );
    }
}

