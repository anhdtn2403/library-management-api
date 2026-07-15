import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Book } from 'src/entities/book.entity';
import { Category } from 'src/entities/category.entity';
import { SubCategory } from 'src/entities/sub-category.entity';
import { Repository } from 'typeorm';
import { CreateSubCategoryInput } from './graphql/create-sub-category.input';
import { UpdateSubCategoryInput } from './graphql/update-sub-category.input';

@Injectable()
export class SubCategoriesService {
    constructor(
        @InjectRepository(SubCategory)
        private readonly subCategoryRepository: Repository<SubCategory>,

        @InjectRepository(Category)
        private readonly categoryRepository: Repository<Category>,

        @InjectRepository(Book)
        private readonly bookRepository: Repository<Book>,
    ) { }

    async findAll(categoryId?: number) {
        const qb = this.subCategoryRepository
            .createQueryBuilder('subCategory')
            .leftJoinAndSelect('subCategory.category', 'category')
            .orderBy('subCategory.id', 'ASC');
        if (categoryId !== undefined) {
            qb.where('subCategory.category_id = :categoryId', { categoryId });
        }
        return qb.getMany();
    }

    async findOne(id: number) {
        const subCategory = await this.subCategoryRepository.findOne({
            where: { id },
            relations: {
                category: true,
            },
        });
        if (!subCategory) {
            throw new NotFoundException('Sub category not found');
        }
        return subCategory;
    }

    async create(dto: CreateSubCategoryInput) {
        const category = await this.categoryRepository.findOne({
            where: { id: dto.category_id },
        });
        if (!category) {
            throw new NotFoundException('Category not found');
        }
        const existed = await this.subCategoryRepository.findOne({
            where: {
                category_id: dto.category_id,
                name: dto.name.trim(),
            },
        });
        if (existed) {
            throw new BadRequestException(
                'Sub category name already exists in this category',
            );
        }
        const subCategory = this.subCategoryRepository.create({
            category_id: dto.category_id,
            name: dto.name.trim(),
        });
        await this.subCategoryRepository.save(subCategory);
        return this.findOne(subCategory.id);
    }

    async update(id: number, dto: UpdateSubCategoryInput) {
        const subCategory =
            await this.subCategoryRepository.findOneBy({ id });

        if (!subCategory) {
            throw new NotFoundException(
                'Sub category not found',
            );
        }

        const targetCategoryId =
            dto.category_id ?? subCategory.category_id;

        const targetName =
            dto.name !== undefined
                ? dto.name.trim()
                : subCategory.name;

        if (dto.category_id !== undefined) {
            const category =
                await this.categoryRepository.findOneBy({
                    id: dto.category_id,
                });

            if (!category) {
                throw new NotFoundException(
                    'Category not found',
                );
            }
        }

        if (
            dto.category_id !== undefined ||
            dto.name !== undefined
        ) {
            const existed =
                await this.subCategoryRepository.findOne({
                    where: {
                        category_id: targetCategoryId,
                        name: targetName,
                    },
                });

            if (existed && existed.id !== id) {
                throw new BadRequestException(
                    'Sub category name already exists in this category',
                );
            }
        }

        subCategory.category_id = targetCategoryId;
        subCategory.name = targetName;

        await this.subCategoryRepository.save(subCategory);

        return this.findOne(id);
    }

    async remove(id: number) {
        const subCategory = await this.findOne(id);
        const totalBooks = await this.bookRepository.count({
            where: {
                sub_category_id: id,
            },
        });
        if (totalBooks > 0) {
            throw new BadRequestException(
                'Cannot delete sub category that has books',
            );
        }
        await this.subCategoryRepository.remove(subCategory);
        return {
            message: 'Sub category deleted successfully',
        };
    }
}
