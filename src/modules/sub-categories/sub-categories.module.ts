import { Module } from '@nestjs/common';
import { SubCategoriesService } from './sub-categories.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubCategory } from 'src/entities/sub-category.entity';
import { Category } from 'src/entities/category.entity';
import { Book } from 'src/entities/book.entity';
import { RolePermission } from 'src/entities/role-permission.entity';
import { SubCategoriesResolver } from './sub-categories.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([SubCategory, Category, Book, RolePermission])],
  providers: [SubCategoriesService, SubCategoriesResolver],
})
export class SubCategoriesModule { }
