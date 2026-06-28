import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserPermission } from 'src/common/enums/user-permission.enum';
import { UserRole } from 'src/common/enums/user-role.enum';
import { RolePermission } from 'src/entities/role-permission.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RolePermissionsService {
    constructor(
        @InjectRepository(RolePermission)
        private readonly rolePermissionRepository: Repository<RolePermission>,
    ) { }

    findAll() {
        return this.rolePermissionRepository.find({
            order: {
                role: 'ASC',
                permission: 'ASC',
            },
        });
    }

    findByRole(role: UserRole) {
        return this.rolePermissionRepository.find({
            where: { role },
            order: {
                permission: 'ASC',
            },
        });
    }

    async updateRolePermissions(role: UserRole, permissions: UserPermission[]) {
        await this.rolePermissionRepository.delete({ role });

        const rolePermissions = permissions.map((permission) =>
            this.rolePermissionRepository.create({
                role,
                permission,
            }),
        );

        return this.rolePermissionRepository.save(rolePermissions);
    }
}