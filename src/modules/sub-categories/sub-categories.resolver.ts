import { UseGuards } from '@nestjs/common';
import {
    Args,
    ID,
    Int,
    Mutation,
    Query,
    Resolver,
} from '@nestjs/graphql';
import { RequirePermissions } from 'src/common/decorators/permission.decorator';
import { UserPermission } from 'src/common/enums/user-permission.enum';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { CreateSubCategoryInput } from './graphql/create-sub-category.input';
import { SubCategoryType } from './graphql/sub-category.type';
import { UpdateSubCategoryInput } from './graphql/update-sub-category.input';
import { SubCategoriesService } from './sub-categories.service';

@Resolver(() => SubCategoryType)
export class SubCategoriesResolver {
    constructor(
        private readonly subCategoriesService: SubCategoriesService,
    ) { }

    @Query(() => [SubCategoryType], {
        name: 'subCategories',
    })
    findAll(
        @Args('categoryId', {
            type: () => Int,
            nullable: true,
        })
        categoryId?: number,
    ) {
        return this.subCategoriesService.findAll(categoryId);
    }

    @Query(() => SubCategoryType, {
        name: 'subCategory',
    })
    findOne(
        @Args('id', { type: () => ID })
        id: number,
    ) {
        return this.subCategoriesService.findOne(Number(id));
    }

    @Mutation(() => SubCategoryType)
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(UserPermission.SUB_CATEGORY_CREATE)
    createSubCategory(
        @Args('input')
        input: CreateSubCategoryInput,
    ) {
        return this.subCategoriesService.create(input);
    }

    @Mutation(() => SubCategoryType)
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(UserPermission.SUB_CATEGORY_UPDATE)
    updateSubCategory(
        @Args('id', { type: () => ID })
        id: number,

        @Args('input')
        input: UpdateSubCategoryInput,
    ) {
        return this.subCategoriesService.update(Number(id), input);
    }

    @Mutation(() => Boolean)
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(UserPermission.SUB_CATEGORY_DELETE)
    async deleteSubCategory(
        @Args('id', { type: () => ID })
        id: number,
    ) {
        await this.subCategoriesService.remove(Number(id));
        return true;
    }
}