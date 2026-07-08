import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { CategoriesService } from './categories.service';
import { UpdateCategoryDto } from './dtos/update-category.dto';
import { RequirePermissions } from 'src/common/decorators/permission.decorator';
import { UserPermission } from 'src/common/enums/user-permission.enum';

@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @Get()
    @RequirePermissions(UserPermission.CATEGORY_VIEW)
    findAll() {
        return this.categoriesService.findAll();
    }

    @Get(':id')
    @RequirePermissions(UserPermission.CATEGORY_VIEW)
    findOne(@Param('id') id: string) {
        return this.categoriesService.findOne(Number(id));
    }

    @Post()
    @RequirePermissions(UserPermission.CATEGORY_CREATE)
    create(@Body() dto: CreateCategoryDto) {
        return this.categoriesService.create(dto);
    }

    @Patch(':id')
    @RequirePermissions(UserPermission.CATEGORY_UPDATE)
    update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
        return this.categoriesService.update(Number(id), dto);
    }

    @Delete(':id')
    @RequirePermissions(UserPermission.CATEGORY_DELETE)
    remove(@Param('id') id: string) {
        return this.categoriesService.remove(Number(id));
    }
}
