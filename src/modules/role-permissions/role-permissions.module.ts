import { Module } from '@nestjs/common';
import { RolePermissionsService } from './role-permissions.service';
import { RolePermission } from 'src/entities/role-permission.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RolePermissionsResolver } from './role-permissions.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([RolePermission])],
  providers: [RolePermissionsService, PermissionsGuard, RolePermissionsResolver], // Guard và Service dùng chung repository trong cùng module
  exports: [TypeOrmModule] // Xuất TypeOrmModule để các module khác có thể sử dụng repository của RolePermission
})
export class RolePermissionsModule { }
