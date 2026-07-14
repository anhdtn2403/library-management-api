import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Category } from 'src/entities/category.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolePermission } from 'src/entities/role-permission.entity';
import { CategoriesResolver } from './categories.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Category, RolePermission])],
  providers: [CategoriesService, CategoriesResolver],
})
export class CategoriesModule { }
