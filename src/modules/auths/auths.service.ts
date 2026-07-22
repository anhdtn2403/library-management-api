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
                throw new BadRequestException('Email đã tồn tại');
            }
            throw new BadRequestException('Tên đăng nhập đã tồn tại');
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
            throw new BadRequestException('Token xác thực email là bắt buộc');
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
            throw new BadRequestException('Token xác thực email không hợp lệ',);
        }
        if (user.is_email_verified) {
            return {
                message: 'Email đã được xác thực trước đó',
            };
        }
        if (!user.email_verification_expires_at ||
            user.email_verification_expires_at.getTime() < Date.now()
        ) {
            throw new BadRequestException('Token xác thực email đã hết hạn');
        }
        user.is_email_verified = true;
        user.email_verification_token_hash = null;
        user.email_verification_expires_at = null;
        await this.userRepository.save(user);
        return {
            message: 'Xác thực email thành công'
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
                message: 'Nếu email tồn tại trong hệ thống, email xác thực đã được gửi'
            };
        }
        if (user.is_email_verified) {
            return {
                message: 'Nếu email tồn tại trong hệ thống, email xác thực đã được gửi'
            };
        }
        if (!user.is_active) {
            return {
                message: 'Nếu email tồn tại trong hệ thống, email xác thực đã được gửi'
            };
        }
        const { rawToken, tokenHash, expiresAt } = this.createEmailVerificationToken();
        user.email_verification_token_hash = tokenHash;
        user.email_verification_expires_at = expiresAt;
        await this.userRepository.save(user);
        await this.mailService.sendVerificationEmail(user.email, user.full_name, rawToken);
        return {
            message: 'Nếu email tồn tại trong hệ thống, email xác thực đã được gửi'
        };
    }

    async login(dto: LoginInput) {
        const user = await this.userRepository.findOneBy({
            username: dto.username
        });
        if (!user) {
            throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không đúng');
        }
        const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không đúng');
        }
        if (!user.is_active) {
            throw new UnauthorizedException('Tài khoản của bạn đã bị vô hiệu hóa');
        }
        if (!user.is_email_verified) {
            throw new UnauthorizedException('Vui lòng xác thực email trước khi đăng nhập');
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
                'Refresh token không hợp lệ hoặc đã hết hạn',
            );
        }
        const user = await this.userRepository.findOneBy({ id: payload.sub });
        if (!user || !user.is_active) {
            throw new UnauthorizedException(
                'Tài khoản không tồn tại hoặc đã bị vô hiệu hóa',
            );
        }
        if (!user.is_email_verified) {
            throw new UnauthorizedException('Email chưa được xác thực');
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

    async forgotPassword(inputEmail: string) {
        const email = inputEmail.trim().toLowerCase();
        const user =
            await this.userRepository
                .createQueryBuilder('user')
                .addSelect(
                    'user.password_reset_token_hash',
                )
                .addSelect(
                    'user.password_reset_expires_at',
                )
                .where(
                    'LOWER(user.email) = :email',
                    {
                        email,
                    },
                )
                .getOne();
        // Luôn trả cùng một message,
        // không tiết lộ email có tồn tại hay không.
        const response = { message: 'Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi' };
        if (!user) {
            return response;
        }
        if (!user.is_active) {
            return response;
        }
        if (!user.is_email_verified) {
            return response;
        }
        const { rawToken, tokenHash, expiresAt } = this.createPasswordResetToken();
        user.password_reset_token_hash = tokenHash;
        user.password_reset_expires_at = expiresAt;
        await this.userRepository.save(user);
        await this.mailService.sendPasswordResetEmail(user.email, user.full_name, rawToken);
        return response;
    }
    async resetPassword(rawToken: string, newPassword: string, confirmPassword: string) {
        if (newPassword !== confirmPassword) {
            throw new BadRequestException('Mật khẩu xác nhận không khớp');
        }
        const token = rawToken.trim();
        if (!token) {
            throw new BadRequestException('Token đặt lại mật khẩu là bắt buộc',);
        }
        const tokenHash = this.hashToken(token);
        const user = await this.userRepository
            .createQueryBuilder('user')
            .addSelect(
                'user.password_reset_token_hash',
            )
            .addSelect(
                'user.password_reset_expires_at',
            )
            .where(
                'user.password_reset_token_hash = :tokenHash',
                {
                    tokenHash,
                },
            )
            .getOne();
        if (!user) {
            throw new BadRequestException('Token đặt lại mật khẩu không hợp lệ');
        }
        if (
            !user.password_reset_expires_at || user.password_reset_expires_at.getTime() < Date.now()) {
            throw new BadRequestException('Token đặt lại mật khẩu đã hết hạn');
        }
        if (!user.is_active) {
            throw new UnauthorizedException('Tài khoản của bạn đã bị vô hiệu hóa');
        }
        const isSamePassword = await bcrypt.compare(newPassword, user.password_hash);
        if (isSamePassword) {
            throw new BadRequestException('Mật khẩu mới phải khác mật khẩu hiện tại');
        }
        user.password_hash = await bcrypt.hash(newPassword, 10);

        // Token chỉ dùng một lần.
        user.password_reset_token_hash = null;
        user.password_reset_expires_at = null;
        await this.userRepository.save(user);
        return { message: 'Đặt lại mật khẩu thành công' };
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
    private createPasswordResetToken(): {
        rawToken: string;
        tokenHash: string;
        expiresAt: Date;
    } {
        const rawToken = randomBytes(32).toString('hex');
        const tokenHash = this.hashToken(rawToken);
        const expiresInMinutes = this.configService.get<number>('PASSWORD_RESET_EXPIRES_MINUTES', 15);
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
