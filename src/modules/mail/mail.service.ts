import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private readonly transporter: nodemailer.Transporter;

    constructor(private readonly configService: ConfigService,) {
        const port = this.configService.getOrThrow<number>('MAIL_PORT');
        this.transporter = nodemailer.createTransport({
            host: this.configService.getOrThrow<string>('MAIL_HOST'),
            port,
            secure: this.configService.get<string>('MAIL_SECURE') === 'true',
            auth: {
                user: this.configService.getOrThrow<string>('MAIL_USER'),
                pass: this.configService.getOrThrow<string>('MAIL_PASSWORD'),
            },
        });
    }

    async sendVerificationEmail(email: string, fullName: string, token: string): Promise<void> {
        const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL',);
        const verificationUrl = `${frontendUrl}/verify-email` + `?token=${encodeURIComponent(token)}`;
        try {
            await this.transporter.sendMail({
                from: this.configService.getOrThrow<string>('MAIL_FROM',),
                to: email,
                subject: 'Xác thực tài khoản LMS của bạn',
                text: [
                    `Xin chào ${fullName},`,
                    '',
                    'Cảm ơn bạn đã đăng ký tài khoản.',
                    'Vui lòng xác thực email bằng cách mở liên kết bên dưới:',
                    verificationUrl,
                    '',
                    `Liên kết xác thực sẽ hết hạn sau ${this.configService.get<string>('EMAIL_VERIFICATION_EXPIRES_MINUTES')} phút.`,
                    'Nếu bạn không thực hiện đăng ký này, bạn có thể bỏ qua email.',
                ].join('\n'),
                html: `
                    <div style="
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 24px;
                        font-family: Arial, sans-serif;
                        color: #222;
                    ">
                        <h2>Xác thực tài khoản</h2>
                        <p>Xin chào <strong>${fullName}</strong>,</p>
                        <p>
                        Cảm ơn bạn đã đăng ký tài khoản tại hệ thống quản lý thư viện.
                        Vui lòng nhấn nút bên dưới để xác thực địa chỉ email.
                        </p>
                        <a
                            href="${verificationUrl}"
                            style="
                                display: inline-block;
                                padding: 12px 20px;
                                background: #2563eb;
                                color: white;
                                text-decoration: none;
                                border-radius: 6px;
                            "
                        >
                            Xác thực email
                        </a>
                        <p>
                        Liên kết xác thực sẽ hết hạn sau ${this.configService.get<string>('EMAIL_VERIFICATION_EXPIRES_MINUTES')} phút.
                        </p>
                        <p style="color: #666;">
                            Nếu bạn không thực hiện đăng ký này, bạn có thể bỏ qua email.
                        </p>
                    </div>`,
            });
        } catch (error) {
            this.logger.error(`Không thể gửi email xác thực đến ${email}`,
                error instanceof Error ? error.stack : undefined);
            throw new InternalServerErrorException('Không thể gửi email xác thực');
        }
    }

    private escapeHtml(value: string): string {
        return value.replace(
            /[&<>"']/g,
            character => {
                const entities:
                    Record<string, string> = {
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#039;',
                };
                return entities[character];
            },
        );
    }

    async sendPasswordResetEmail(email: string, fullName: string, token: string): Promise<void> {
        const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
        const resetUrl =
            `${frontendUrl}/reset-password` +
            `?token=${encodeURIComponent(token)}`;
        try {
            await this.transporter.sendMail({
                from: this.configService.getOrThrow<string>('MAIL_FROM'),
                to: email,
                subject: 'Đặt lại mật khẩu tài khoản LMS',
                text: [
                    `Xin chào ${fullName},`,
                    '',
                    'Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.',
                    'Vui lòng mở liên kết bên dưới để đặt lại mật khẩu:',
                    resetUrl,
                    '',
                    `Liên kết này sẽ hết hạn sau ${this.configService.get<string>('PASSWORD_RESET_EXPIRES_MINUTES')} phút.`,
                    'Nếu bạn không yêu cầu đặt lại mật khẩu, bạn có thể bỏ qua email.',
                ].join('\n'),
                html: `
                <div style="
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 24px;
                    font-family: Arial, sans-serif;
                    color: #222;
                ">
                    <h2>Đặt lại mật khẩu</h2>
                    <p>Xin chào <strong>${fullName}</strong>,</p>
                    <p>
                    Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu
                    cho tài khoản của bạn.
                    </p>
                    <a
                        href="${resetUrl}"
                        style="
                            display: inline-block;
                            padding: 12px 20px;
                            background: #2563eb;
                            color: white;
                            text-decoration: none;
                            border-radius: 6px;
                        "
                    >
                        Đặt lại mật khẩu
                    </a>
                    <p>
                    Liên kết này sẽ hết hạn sau ${this.configService.get<string>('PASSWORD_RESET_EXPIRES_MINUTES')} phút.
                    </p>
                    <p>
                    Nếu bạn không yêu cầu đặt lại mật khẩu,
                    bạn có thể bỏ qua email này.
                    </p>
                </div>`,
            });
        } catch (error) {
            this.logger.error(
                `Không thể gửi email đặt lại mật khẩu tới ${email}`,
                error instanceof Error ? error.stack : undefined,
            );
            throw new InternalServerErrorException('Không thể gửi email đặt lại mật khẩu');
        }
    }
}
