import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Book } from 'src/entities/book.entity';
import { UserFavoriteBook } from 'src/entities/user-favorite-book.entity';
import { RolePermission } from 'src/entities/role-permission.entity';
import { UserFavoriteBooksService } from './user-favorite-books.service';
import { UsersResolver } from './users.resolver';
import { MyAccountResolver } from './my-account.resolver';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Book,
      UserFavoriteBook,
      RolePermission,
    ]),
  ],
  providers: [
    UsersService,
    UserFavoriteBooksService,
    UsersResolver,
    MyAccountResolver,
    PermissionsGuard
  ],
  exports: [
    UsersService,
  ]
})
export class UsersModule { }
