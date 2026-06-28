import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { BooksService } from './books.service';
import { CreateBookDto } from './dtos/create-book.dto';
import { UpdateBookDto } from './dtos/update-book.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { RolesGuard } from 'src/common/guards/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard) //Toàn bộ API /books đều yêu cầu đăng nhập.
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
    @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
    create(@Body() dto: CreateBookDto) {
        return this.booksService.create(dto);
    }

    @Put(':id') // PUT http://localhost:3000/books/1
    @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
    update(@Param('id') id: string, @Body() dto: UpdateBookDto) {
        return this.booksService.update(
            Number(id),
            dto,
        );
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    remove(@Param('id') id: string) {
        return this.booksService.remove(
            Number(id),
        );
    }
}

