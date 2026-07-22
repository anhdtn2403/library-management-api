import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Book } from 'src/entities/book.entity';
import { Not, Repository } from 'typeorm';
import { SubCategory } from 'src/entities/sub-category.entity';
import { join } from 'path';
import { createWriteStream, existsSync, mkdirSync, unlinkSync } from 'fs';
import { GetBooksInput } from './graphql/get-books.input';
import { CreateBookInput } from './graphql/create-book.input';
import { UpdateBookInput } from './graphql/update-book.input';
import { FileUpload } from 'src/common/graphql/file-upload.type';
import { randomUUID } from 'crypto';
import { pipeline } from 'stream/promises';

@Injectable()
// @Injectable() báo cho NestJS biết class này là provider, 
// có thể được inject vào Controller.
export class BooksService {
    constructor(
        @InjectRepository(Book)
        private readonly bookRepository: Repository<Book>,

        @InjectRepository(SubCategory)
        private readonly subCategoryRepository: Repository<SubCategory>,
    ) { }

    async findAll(query: GetBooksInput) {
        const pageNumber = query.page || 1;
        const pageSize = query.pageSize || 10;
        const qb = this.bookRepository
            .createQueryBuilder('book') // Tạo một query builder cho entity Book, đặt alias là 'book'
            .leftJoinAndSelect('book.sub_category', 'subCategory')
            .leftJoinAndSelect('subCategory.category', 'category')
            .select([
                'book.id',
                'book.sub_category_id',
                'book.title',
                'book.isbn',
                'book.author',
                'book.image_url',
                'book.publisher',
                'book.publisher_year',
                'book.total_quantity',
                'book.borrowed_quantity',
                'book.is_active',
                'book.description',
                'book.max_borrow_days',
                'book.deposit_amount',
                'book.fine_per_day',
                'book.replacement_cost',
                'book.fee_per_day',
                'book.fee_per_week',
                'book.fee_per_month',
                'book.created_at',
                'book.updated_at',

                'subCategory.id',
                'subCategory.name',

                'category.id',
                'category.name',
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
        if (query.sub_category_id !== undefined) {
            qb.andWhere('book.sub_category_id = :subCategoryId', {
                subCategoryId: query.sub_category_id,
            });
        }
        if (query.category_id !== undefined) {
            qb.andWhere('subCategory.category_id = :categoryId', {
                categoryId: query.category_id,
            });
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
        const book = await this.bookRepository.findOne({
            where: {
                id: id
            },
            relations: {
                sub_category: {
                    category: true,
                },
            },
        });
        if (!book) {
            throw new NotFoundException('Không tìm thấy sách');
        }
        return book;
    }

    async create(dto: CreateBookInput) {
        const existingTitle = await this.bookRepository
            .createQueryBuilder('book')
            .where('LOWER(book.title) = LOWER(:title)', {
                title: dto.title.trim(),
            })
            .getOne();

        if (existingTitle) {
            throw new BadRequestException('Tên sách đã tồn tại');
        }
        if (dto.isbn) {
            const existingBook = await this.bookRepository.findOne({
                where: {
                    isbn: dto.isbn
                },
            });

            if (existingBook) {
                throw new BadRequestException('ISBN đã tồn tại');
            }
        }
        const subCategory =
            await this.subCategoryRepository.findOneBy({
                id: dto.sub_category_id,
            });

        if (!subCategory) {
            throw new NotFoundException(
                'Không tìm thấy thể loại con',
            );
        }
        const book = this.bookRepository.create(dto);
        if (book.borrowed_quantity > book.total_quantity) {
            throw new BadRequestException(
                'Số lượng đang được mượn không thể lớn hơn tổng số lượng sách',
            );
        }
        return this.bookRepository.save(book);
    }

    async update(id: number, dto: UpdateBookInput) {
        const book = await this.bookRepository.findOneBy({ id });
        if (!book) {
            throw new NotFoundException('Không tìm thấy sách');
        }
        if (dto.title !== undefined) {
            const existingTitle = await this.bookRepository
                .createQueryBuilder('book')
                .where('LOWER(book.title) = LOWER(:title)', {
                    title: dto.title.trim(),
                })
                .andWhere('book.id != :id', { id })
                .getOne();

            if (existingTitle) {
                throw new BadRequestException('Tên sách đã tồn tại');
            }
        }
        if (dto.isbn) {
            const existingBook = await this.bookRepository.findOne({
                where: {
                    isbn: dto.isbn,
                    id: Not(id),
                },
            });

            if (existingBook) {
                throw new BadRequestException('ISBN đã tồn tại');
            }
        }
        if (dto.sub_category_id !== undefined) {
            const subCategory =
                await this.subCategoryRepository.findOneBy({
                    id: dto.sub_category_id,
                });

            if (!subCategory) {
                throw new NotFoundException(
                    'Không tìm thấy thể loại con',
                );
            }
        }
        Object.assign(book, dto);
        if (book.borrowed_quantity > book.total_quantity) {
            throw new BadRequestException(
                'Số lượng đang được mượn không thể lớn hơn tổng số lượng sách',
            );
        }
        await this.bookRepository.save(book);
        return this.findOne(id);
    }

    async remove(id: number) {
        const book = await this.findOne(id);
        //this.bookRepository.delete(id); -> ko xóa cứng, vì có thể có lịch sử mượn sách trước đó
        // xóa mềm -> Book ko cho mượn nữa, lưu lịch sử mượn trước đó
        book.is_active = false;
        await this.bookRepository.save(book);
    }
    async uploadImage(id: number, upload: Promise<FileUpload>) {
        const book = await this.bookRepository.findOneBy({
            id,
        });
        if (!book) {
            throw new NotFoundException('Không tìm thấy sách');
        }

        const { filename: originalFilename, mimetype, createReadStream } = await upload;
        console.log({
            originalFilename,
            mimetype,
            createReadStream: typeof createReadStream,
        });
        const allowedMimeTypes = [
            'image/jpg',
            'image/jpeg',
            'image/png',
            'image/webp',
        ];
        if (!allowedMimeTypes.includes(mimetype)) {
            throw new BadRequestException(
                `Chỉ chấp nhận ảnh định dạng JPG, JPEG, PNG hoặc WEBP`,
            );
        }
        const extensionByMimeType: Record<string, string> = {
            'image/jpg': '.jpg',
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'image/webp': '.webp',
        };
        const extension = extensionByMimeType[mimetype];
        const filename = `${randomUUID()}${extension}`;

        const uploadDirectory = join(process.cwd(), 'uploads', 'books');
        if (!existsSync(uploadDirectory)) {
            mkdirSync(uploadDirectory, {
                recursive: true,
            });
        }
        const filePath = join(uploadDirectory, filename,);

        try {
            await pipeline(createReadStream(), createWriteStream(filePath),);
        } catch {
            this.deleteFileIfExists(filePath);

            throw new BadRequestException(
                'Không thể lưu ảnh đã tải lên',
            );
        }

        return this.updateImage(
            id,
            filename,
        );
    }
    async updateImage(id: number, filename: string) {
        const uploadedFilePath = join(
            process.cwd(),
            'uploads',
            'books',
            filename,
        );
        const book = await this.bookRepository.findOneBy({
            id,
        });
        if (!book) {
            this.deleteFileIfExists(uploadedFilePath);
            throw new NotFoundException(
                'Không tìm thấy sách',
            );
        }
        const oldImageUrl = book.image_url;
        book.image_url =
            `/uploads/books/${filename}`;
        try {
            await this.bookRepository.save(book);
        } catch (error) {
            // Nếu lưu database thất bại thì xóa ảnh vừa upload,
            // tránh tạo file rác trong server.
            this.deleteFileIfExists(uploadedFilePath);
            throw error;
        }
        // Chỉ xóa ảnh cũ sau khi cập nhật database thành công.
        if (
            oldImageUrl &&
            oldImageUrl.startsWith('/uploads/books/')
        ) {
            const oldFilename = oldImageUrl.replace(
                '/uploads/books/',
                '',
            );
            const oldFilePath = join(
                process.cwd(),
                'uploads',
                'books',
                oldFilename,
            );

            this.deleteFileIfExists(oldFilePath);
        }
        return this.findOne(id);
    }

    private deleteFileIfExists(filePath: string) {
        if (existsSync(filePath)) {
            unlinkSync(filePath);
        }
    }
}
