import { Body, Controller, Delete, Get, Param, ParseFilePipe, ParseIntPipe, Patch, Post, Put, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { BooksService } from './books.service';
import { CreateBookDto } from './dtos/create-book.dto';
import { UpdateBookDto } from './dtos/update-book.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { UserPermission } from 'src/common/enums/user-permission.enum';
import { RequirePermissions } from 'src/common/decorators/permission.decorator';
import { GetBooksQueryDto } from './dtos/get-books-query.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { bookImageUploadOptions } from 'src/common/configs/image-upload.config';

//@UseGuards(JwtAuthGuard, RolesGuard) //Toàn bộ API /books đều yêu cầu đăng nhập.
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('books')
export class BooksController {
    constructor(
        private readonly booksService: BooksService
    ) { }

    @Get() // GET http://localhost:3000/books
    @RequirePermissions(UserPermission.BOOK_VIEW)
    findAll(@Query() query: GetBooksQueryDto) {
        return this.booksService.findAll(query);
    }

    @Get(':id') // GET http://localhost:3000/books/1
    @RequirePermissions(UserPermission.BOOK_VIEW)
    findOne(@Param('id') id: string) {
        return this.booksService.findOne(Number(id));
    }

    @Post() // POST http://localhost:3000/books
    @RequirePermissions(UserPermission.BOOK_CREATE)
    create(@Body() dto: CreateBookDto) {
        return this.booksService.create(dto);
    }

    @Put(':id') // PUT http://localhost:3000/books/1
    @RequirePermissions(UserPermission.BOOK_UPDATE)
    update(@Param('id') id: string, @Body() dto: UpdateBookDto) {
        return this.booksService.update(
            Number(id),
            dto,
        );
    }

    @Delete(':id')
    @RequirePermissions(UserPermission.BOOK_DELETE)
    remove(@Param('id') id: string) {
        return this.booksService.remove(
            Number(id),
        );
    }

    @Patch(':id/image')
    @RequirePermissions(UserPermission.BOOK_UPDATE)
    @UseInterceptors(
        FileInterceptor(
            'image',
            bookImageUploadOptions,
        ),
    )
    updateImage(
        @Param('id', ParseIntPipe) id: number,

        @UploadedFile(
            new ParseFilePipe({
                fileIsRequired: true,
            }),
        )
        image: Express.Multer.File,
    ) {
        return this.booksService.updateImage(
            id,
            image.filename,
        );
    }
}

