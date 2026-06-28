import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { RolePermission } from 'src/entities/role-permission.entity';
import { UserPermission } from '../enums/user-permission.enum';
import { PERMISSIONS_KEY } from '../decorators/permission.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,

        @InjectRepository(RolePermission)
        private readonly rolePermissionRepository: Repository<RolePermission>,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredPermissions =
            this.reflector.getAllAndOverride<UserPermission[]>(PERMISSIONS_KEY, [
                context.getHandler(),
                context.getClass(),
            ]);

        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || !user.role) {
            throw new ForbiddenException('User role not found');
        }

        const rolePermissions = await this.rolePermissionRepository.find({
            where: {
                role: user.role,
                permission: In(requiredPermissions),
            },
        });

        if (rolePermissions.length === 0) {
            throw new ForbiddenException('You do not have permission');
        }

        return true;
    }
}