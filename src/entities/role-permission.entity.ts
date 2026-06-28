import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { UserRole } from '../common/enums/user-role.enum';
import { UserPermission } from '../common/enums/user-permission.enum';

@Entity('role_permissions')
export class RolePermission {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({
        type: 'enum',
        enum: UserRole,
    })
    role!: UserRole;

    @Column({
        type: 'enum',
        enum: UserPermission,
    })
    permission!: UserPermission;
}