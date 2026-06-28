import { Module } from '@nestjs/common';
import { RolePermissionsController } from './role-permissions.controller';
import { RolePermissionsService } from './role-permissions.service';
import { RolePermission } from 'src/entities/role-permission.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';

@Module({
  imports: [TypeOrmModule.forFeature([RolePermission])],
  controllers: [RolePermissionsController],
  providers: [RolePermissionsService, PermissionsGuard], // Guard và Service dùng chung repository trong cùng module
  exports: [TypeOrmModule] // Xuất TypeOrmModule để các module khác có thể sử dụng repository của RolePermission
})
export class RolePermissionsModule { }
