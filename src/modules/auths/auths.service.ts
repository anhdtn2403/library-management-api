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
import { MailService } from '../mail/mail.service';
import { createHash, randomBytes } from 'crypto';
@Injectable()
export class AuthsService {
    constructor(
        @InjectRepository(User) // Inject Repository<User> để có thể thao tác với bảng users trong DB
        private readonly userRepository: Repository<User>,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly mailService: MailService,
    ) { }
    async register(dto: RegisterInput) {
        const email = dto.email.trim().toLowerCase();
        const username = dto.username.trim();
        const existedUser = await this.userRepository
            .createQueryBuilder('user')
            .where(
                'LOWER(user.email) = :email',
                { email },
            )
            .orWhere(
                'LOWER(user.username) = LOWER(:username)',
                { username },
            )
            .getOne();
        if (existedUser) {
            if (existedUser.email.toLowerCase() === email) {
                throw new BadRequestException('Email already exists');
            }
            throw new BadRequestException('Username already exists');
        }
        const hashedPassword = await bcrypt.hash(dto.password, 10);

        const { rawToken, tokenHash, expiresAt } = this.createEmailVerificationToken();

        const user = this.userRepository.create({
            username: username,
            full_name: dto.full_name.trim(),
            email: email,
            password_hash: hashedPassword,
            role: UserRole.MEMBER, // Mặc định role là MEMBER, không cho user tự chọn role
            is_active: true,
            is_email_verified: false,
            email_verification_token_hash: tokenHash,
            email_verification_expires_at: expiresAt
        });
        const savedUser = await this.userRepository.save(user);
        await this.mailService.sendVerificationEmail(savedUser.email, savedUser.full_name, rawToken);
        const { password_hash, email_verification_token_hash, email_verification_expires_at, ...result } = savedUser;
        // Object Destructuring + Rest Operator
        // Bỏ thuộc tính password_hash ra, gom tất cả thuộc tính còn lại thành object mới tên result
        return result;
    }

    async verifyEmail(rawToken: string) {
        const token = rawToken.trim();
        if (!token) {
            throw new BadRequestException('Verification token is required');
        }
        const tokenHash = this.hashToken(token);
        const user = await this.userRepository
            .createQueryBuilder('user')
            .addSelect(
                'user.email_verification_token_hash',
            )
            .addSelect(
                'user.email_verification_expires_at',
            )
            .where(
                'user.email_verification_token_hash = :tokenHash',
                {
                    tokenHash
                },
            )
            .getOne();
        if (!user) {
            throw new BadRequestException('Invalid verification token',);
        }
        if (user.is_email_verified) {
            return {
                message: 'Email has already been verified',
            };
        }
        if (!user.email_verification_expires_at ||
            user.email_verification_expires_at.getTime() < Date.now()
        ) {
            throw new BadRequestException('Verification token has expired');
        }
        user.is_email_verified = true;
        await this.userRepository.save(user);
        return {
            message: 'Email verified successfully'
        };
    }

    async resendVerificationEmail(inputEmail: string) {
        const email = inputEmail.trim().toLowerCase();
        const user =
            await this.userRepository
                .createQueryBuilder('user')
                .addSelect(
                    'user.email_verification_token_hash',
                )
                .addSelect(
                    'user.email_verification_expires_at',
                )
                .where(
                    'LOWER(user.email) = :email',
                    {
                        email,
                    },
                )
                .getOne();

        //Không nên thông báo rõ email có tồn tại hay không,
        // tránh việc người ngoài dò danh sách tài khoản.
        if (!user) {
            return {
                message: 'If the email exists, a verification email has been sent'
            };
        }
        if (user.is_email_verified) {
            return {
                message: 'If the email exists, a verification email has been sent'
            };
        }
        if (!user.is_active) {
            return {
                message: 'If the email exists, a verification email has been sent'
            };
        }
        const { rawToken, tokenHash, expiresAt } = this.createEmailVerificationToken();
        user.email_verification_token_hash = tokenHash;
        user.email_verification_expires_at = expiresAt;
        await this.userRepository.save(user);
        await this.mailService.sendVerificationEmail(user.email, user.full_name, rawToken);
        return {
            message: 'If the email exists, a verification email has been sent'
        };
    }

    async login(dto: LoginInput) {
        const user = await this.userRepository.findOneBy({
            username: dto.username
        });
        if (!user) {
            throw new UnauthorizedException('Invalid username or password');
        }
        const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid username or password');
        }
        if (!user.is_active) {
            throw new UnauthorizedException('Your account has been deactivated');
        }
        if (!user.is_email_verified) {
            throw new UnauthorizedException('Please verify your email before logging in');
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
        if (!user.is_email_verified) {
            throw new UnauthorizedException('Email has not been verified');
        }
        const newPayload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };
        return {
            access_token: this.jwtService.sign(newPayload)
        };
    }

    private createEmailVerificationToken(): {
        rawToken: string;
        tokenHash: string;
        expiresAt: Date;
    } {
        const rawToken = randomBytes(32).toString('hex');
        const tokenHash = this.hashToken(rawToken);
        const expiresInMinutes = this.configService.get<number>('EMAIL_VERIFICATION_EXPIRES_MINUTES', 30);
        const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
        return {
            rawToken,
            tokenHash,
            expiresAt,
        };
    }

    private hashToken(token: string): string {
        return createHash('sha256').update(token).digest('hex');
    }
}
