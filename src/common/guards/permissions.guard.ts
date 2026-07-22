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
import { GqlExecutionContext } from '@nestjs/graphql';

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

        let request;
        if (context.getType<'graphql' | 'http'>() === 'graphql') {
            const ctx = GqlExecutionContext.create(context);
            request = ctx.getContext().req;
        } else {
            request = context.switchToHttp().getRequest();
        }
        const user = request.user;

        if (!user || !user.role) {
            throw new ForbiddenException('Không tìm thấy vai trò của người dùng');
        }

        const rolePermissions = await this.rolePermissionRepository.find({
            where: {
                role: user.role,
                permission: In(requiredPermissions),
            },
        });

        if (rolePermissions.length === 0) {
            throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này');
        }

        return true;
    }
}