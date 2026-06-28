import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enums/user-role.enum';

export const ROLES_KEY = 'roles';

// Tạo decorator @Roles() để lưu danh sách role vào metadata với key 'roles'
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);