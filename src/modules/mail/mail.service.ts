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
                subject: 'Verify your Library Management account',
                text: [
                    `Hello ${fullName},`,
                    '',
                    'Please verify your email by opening the link below:',
                    verificationUrl,
                    '',
                    'This link will expire soon.',
                ].join('\n'),
                html: `
                    <div style="
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 24px;
                        font-family: Arial, sans-serif;
                        color: #222;
                    ">
                        <h2>
                            Verify your email
                        </h2>
                        <p>
                            Hello ${this.escapeHtml(fullName)},
                        </p>
                        <p>
                            Thank you for registering
                            your Library Management account.
                        </p>
                        <p>
                            Click the button below to
                            verify your email address.
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
                            Verify email
                        </a>
                        <p style="
                            margin-top: 24px;
                            color: #666;
                        ">
                            If the button does not work,
                            copy this URL into your browser:
                        </p>
                        <p style="word-break: break-all;">
                            ${verificationUrl}
                        </p>
                        <p style="color: #666;">
                            If you did not create this account,
                            you can ignore this email.
                        </p>
                    </div>`,
            });
        } catch (error) {
            this.logger.error(`Cannot send verification email to ${email}`,
                error instanceof Error ? error.stack : undefined);
            throw new InternalServerErrorException('Unable to send verification email');
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
                subject: 'Reset your Library Management password',
                text: [
                    `Hello ${fullName},`,
                    '',
                    'Open the link below to reset your password:',
                    resetUrl,
                    '',
                    'This link will expire soon.',
                    '',
                    'If you did not request this, ignore this email.',
                ].join('\n'),
                html: `
                <div style="
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 24px;
                    font-family: Arial, sans-serif;
                    color: #222;
                ">
                    <h2>Reset your password</h2>
                    <p>
                        Hello ${this.escapeHtml(fullName)},
                    </p>
                    <p>
                        We received a request to reset
                        your Library Management password.
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
                        Reset password
                    </a>
                    <p style="
                        margin-top: 24px;
                        color: #666;
                    ">
                        If the button does not work,
                        copy this URL into your browser:
                    </p>
                    <p style="word-break: break-all;">
                        ${resetUrl}
                    </p>
                    <p style="color: #666;">
                        If you did not request a password
                        reset, you can ignore this email.
                    </p>
                </div>`,
            });
        } catch (error) {
            this.logger.error(
                `Cannot send password reset email to ${email}`,
                error instanceof Error ? error.stack : undefined,
            );
            throw new InternalServerErrorException('Unable to send password reset email');
        }
    }
}
