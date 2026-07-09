import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { SubCategoriesService } from './sub-categories.service';
import { RequirePermissions } from 'src/common/decorators/permission.decorator';
import { UserPermission } from 'src/common/enums/user-permission.enum';
import { CreateSubCategoryDto } from './dtos/create-sub-category.dto';
import { UpdateSubCategoryDto } from './dtos/update-sub-category.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('sub-categories')
export class SubCategoriesController {
    constructor(
        private readonly subCategoriesService: SubCategoriesService,
    ) { }

    @Get()
    @RequirePermissions(UserPermission.SUB_CATEGORY_VIEW)
    findAll(@Query('category_id') categoryId?: string) {
        return this.subCategoriesService.findAll(
            categoryId ? Number(categoryId) : undefined,
        );
    }

    @Get(':id')
    @RequirePermissions(UserPermission.SUB_CATEGORY_VIEW)
    findOne(@Param('id') id: string) {
        return this.subCategoriesService.findOne(Number(id));
    }

    @Post()
    @RequirePermissions(UserPermission.SUB_CATEGORY_CREATE)
    create(@Body() dto: CreateSubCategoryDto) {
        return this.subCategoriesService.create(dto);
    }

    @Put(':id')
    @RequirePermissions(UserPermission.SUB_CATEGORY_UPDATE)
    update(@Param('id') id: string, @Body() dto: UpdateSubCategoryDto) {
        return this.subCategoriesService.update(Number(id), dto);
    }

    @Delete(':id')
    @RequirePermissions(UserPermission.SUB_CATEGORY_DELETE)
    remove(@Param('id') id: string) {
        return this.subCategoriesService.remove(Number(id));
    }
}
