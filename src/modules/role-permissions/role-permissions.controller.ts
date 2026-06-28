import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { RolePermissionsService } from './role-permissions.service';
import { UpdateRolePermissionsDto } from './dtos/update-role-permissions.dto';

@Controller('role-permissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class RolePermissionsController {
    constructor(
        private readonly rolePermissionsService: RolePermissionsService,
    ) { }

    @Get()
    findAll() {
        return this.rolePermissionsService.findAll();
    }

    @Get(':role')
    findByRole(@Param('role') role: UserRole) {
        return this.rolePermissionsService.findByRole(role);
    }

    @Put(':role')
    updateRolePermissions(
        @Param('role') role: UserRole,
        @Body() dto: UpdateRolePermissionsDto,
    ) {
        return this.rolePermissionsService.updateRolePermissions(
            role,
            dto.permissions,
        );
    }
}
