import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from 'src/entities/category.entity';
import { Repository } from 'typeorm';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { UpdateCategoryDto } from './dtos/update-category.dto';

@Injectable()
export class CategoriesService {
    constructor(
        @InjectRepository(Category)
        private readonly categoryRepository: Repository<Category>,
    ) { }

    async findAll() {
        return this.categoryRepository.find({
            relations: {
                sub_categories: true,
            },
            order: {
                id: 'ASC',
            },
        });
    }

    async findOne(id: number) {
        const category = await this.categoryRepository.findOne({
            where: { id },
            relations: {
                sub_categories: true,
            },
        });

        if (!category) {
            throw new NotFoundException('Category not found');
        }

        return category;
    }

    async create(dto: CreateCategoryDto) {
        const existed = await this.categoryRepository.findOne({
            where: { name: dto.name.trim() },
        });

        if (existed) {
            throw new BadRequestException('Category name already exists');
        }

        const category = this.categoryRepository.create({
            name: dto.name.trim(),
        });

        return this.categoryRepository.save(category);
    }

    async update(id: number, dto: UpdateCategoryDto) {
        const category = await this.findOne(id);

        if (dto.name) {
            const existed = await this.categoryRepository.findOne({
                where: { name: dto.name.trim() },
            });

            if (existed && existed.id !== id) {
                throw new BadRequestException('Category name already exists');
            }

            category.name = dto.name.trim();
        }

        return this.categoryRepository.save(category);
    }

    async remove(id: number) {
        const category = await this.findOne(id);

        if (category.sub_categories?.length > 0) {
            throw new BadRequestException(
                'Cannot delete category that has sub categories',
            );
        }

        await this.categoryRepository.remove(category);
    }
}
