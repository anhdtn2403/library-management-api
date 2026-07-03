import { Module } from '@nestjs/common';
import { AuthsController } from './auths.controller';
import { AuthsService } from './auths.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from 'src/common/strategies/jwt.strategy';

@Module({
  imports: [
    // Đăng ký entity User để TypeORM quản lý 
    // -> có thể inject Repository<User> vào service
    TypeOrmModule.forFeature([User]),

    // Đăng ký strategy jwt để Passport biết cách xác thực người dùng
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),

    // Đăng ký module JWT để có thể inject JwtService vào service -> tạo token
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '30m' // '30s' '5m' '1h' '1d'
        },
      }),
    }),

  ],
  controllers: [AuthsController],
  providers: [AuthsService, JwtStrategy]
})
export class AuthsModule { }
