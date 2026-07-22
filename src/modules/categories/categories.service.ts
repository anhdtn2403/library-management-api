import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from 'src/entities/category.entity';
import { Repository } from 'typeorm';
import { CreateCategoryInput } from './graphql/create-category.input';
import { UpdateCategoryInput } from './graphql/update-category.input';

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
            throw new NotFoundException('Không tìm thấy thể loại');
        }

        return category;
    }

    async create(dto: CreateCategoryInput) {
        const existed = await this.categoryRepository.findOne({
            where: { name: dto.name.trim() },
        });

        if (existed) {
            throw new BadRequestException('Tên thể loại đã tồn tại');
        }

        const category = this.categoryRepository.create({
            name: dto.name.trim(),
        });

        return this.categoryRepository.save(category);
    }

    async update(id: number, dto: UpdateCategoryInput) {
        const category = await this.findOne(id);

        if (dto.name) {
            const existed = await this.categoryRepository.findOne({
                where: { name: dto.name.trim() },
            });

            if (existed && existed.id !== id) {
                throw new BadRequestException('Tên thể loại đã tồn tại');
            }

            category.name = dto.name.trim();
        }

        return this.categoryRepository.save(category);
    }

    async remove(id: number) {
        const category = await this.findOne(id);

        if (category.sub_categories?.length > 0) {
            throw new BadRequestException(
                'Không thể xóa thể loại đang chứa thể loại con',
            );
        }

        await this.categoryRepository.remove(category);
    }
}
