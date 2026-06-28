import { IsArray, IsEnum } from 'class-validator';
import { UserPermission } from 'src/common/enums/user-permission.enum';

export class UpdateRolePermissionsDto {
    @IsArray()
    @IsEnum(UserPermission, { each: true })
    permissions!: UserPermission[];
}