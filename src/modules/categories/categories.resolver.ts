import { Args, ID, Mutation, Query, Resolver } from "@nestjs/graphql";
import { CategoryType } from "./graphql/category.type";
import { CategoriesService } from "./categories.service";
import { UseGuards } from "@nestjs/common";
import { RequirePermissions } from "src/common/decorators/permission.decorator";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { PermissionsGuard } from "src/common/guards/permissions.guard";
import { UserPermission } from "src/common/enums/user-permission.enum";
import { CreateCategoryInput } from "./graphql/create-category.input";
import { UpdateCategoryInput } from "./graphql/update-category.input";

@Resolver(() => CategoryType)
export class CategoriesResolver {
    constructor(private readonly categoriesService: CategoriesService) { }

    @Query(() => [CategoryType], { name: "categories" })
    findAllCategories() {
        return this.categoriesService.findAll();
    }

    @Query(() => CategoryType, { name: "category" })
    findOneCategory(@Args("id", { type: () => ID }) id: number) {
        return this.categoriesService.findOne(Number(id));
    }

    @Mutation(() => CategoryType, { name: "createCategory" })
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(UserPermission.CATEGORY_CREATE)
    createCategory(@Args("input") input: CreateCategoryInput) {
        return this.categoriesService.create(input);
    }

    @Mutation(() => CategoryType, { name: "updateCategory" })
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(UserPermission.CATEGORY_UPDATE)
    updateCategory(
        @Args("id", { type: () => ID }) id: number,
        @Args("input") input: UpdateCategoryInput
    ) {
        return this.categoriesService.update(Number(id), input);
    }

    @Mutation(() => Boolean, { name: "deleteCategory" })
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(UserPermission.CATEGORY_DELETE)
    async deleteCategory(@Args("id", { type: () => ID }) id: number) {
        await this.categoriesService.remove(Number(id));
        return true;
    }
}