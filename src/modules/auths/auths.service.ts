import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import { RegisterDto } from './dtos/register.dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from 'src/common/enums/user-role.enum';
import { LoginDto } from './dtos/login.dto';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class AuthsService {
    constructor(
        @InjectRepository(User) // Inject Repository<User> để có thể thao tác với bảng users trong DB
        private readonly userRepository: Repository<User>,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService
    ) { }
    async register(dto: RegisterDto) {
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
            role: dto.role
        });

        const savedUser = await this.userRepository.save(user);

        const { password_hash, ...result } = savedUser;
        // Object Destructuring + Rest Operator
        // Bỏ thuộc tính password_hash ra, gom tất cả thuộc tính còn lại thành object mới tên result

        return result;
    }

    async login(dto: LoginDto) {
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
        try {
            const payload = this.jwtService.verify(
                refreshToken,
                {
                    secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
                },
            );
            const newPayload = {
                sub: payload.sub,
                email: payload.email,
                role: payload.role,
            };
            const accessToken = this.jwtService.sign(newPayload);
            return {
                access_token: accessToken,
            };
        } catch {
            throw new UnauthorizedException(
                'Invalid refresh token',
            );
        }
    }
}
