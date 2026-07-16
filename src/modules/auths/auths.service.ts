import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserRole } from 'src/common/enums/user-role.enum';
import { ConfigService } from '@nestjs/config';
import { RegisterInput } from './graphql/register.input';
import { LoginInput } from './graphql/login.input';
@Injectable()
export class AuthsService {
    constructor(
        @InjectRepository(User) // Inject Repository<User> để có thể thao tác với bảng users trong DB
        private readonly userRepository: Repository<User>,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService
    ) { }
    async register(dto: RegisterInput) {
        const existedUser = await this.userRepository.findOneBy({
            email: dto.email,
        });
        if (existedUser) {
            throw new BadRequestException('Email already exists');
        }

        const hashedPassword = await bcrypt.hash(dto.password, 10);
        // Không lưu password thật vào DB.

        const user = this.userRepository.create({
            username: dto.username,
            full_name: dto.full_name,
            email: dto.email,
            password_hash: hashedPassword,
            role: UserRole.MEMBER, // Mặc định role là MEMBER, không cho user tự chọn role
        });

        const savedUser = await this.userRepository.save(user);

        const { password_hash, ...result } = savedUser;
        // Object Destructuring + Rest Operator
        // Bỏ thuộc tính password_hash ra, gom tất cả thuộc tính còn lại thành object mới tên result

        return result;
    }

    async login(dto: LoginInput) {
        const user = await this.userRepository.findOneBy({
            username: dto.username,
        });
        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }
        const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid email or password');
        }
        if (!user.is_active) {
            throw new UnauthorizedException(
                'Your account has been deactivated',
            );
        }

        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };
        const accessToken = this.jwtService.sign(payload);
        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
            expiresIn: '7d',
        });

        return {
            access_token: accessToken,
            refresh_token: refreshToken
        };
    }

    async refresh(refreshToken: string) {
        let payload;
        try {
            payload = await this.jwtService.verifyAsync(
                refreshToken,
                {
                    secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET',),
                }
            );
        } catch {
            throw new UnauthorizedException(
                'Invalid refresh token',
            );
        }

        const user = await this.userRepository.findOneBy({ id: payload.sub });
        if (!user || !user.is_active) {
            throw new UnauthorizedException(
                'Account is inactive or does not exist',
            );
        }

        const newPayload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };
        return {
            access_token:
                this.jwtService.sign(newPayload),
        };
    }
}
