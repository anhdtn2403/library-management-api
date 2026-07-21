import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Not, Repository } from 'typeorm';
import { GetUsersInput } from './graphql/get-users.input';
import { UpdateProfileInput } from './graphql/update-profile.input';
import { UpdateUserRoleInput } from './graphql/update-user-role.input';
import { UpdateUserStatusInput } from './graphql/update-user-status.input';
import { FileUpload } from 'src/common/graphql/file-upload.type';
import { randomUUID } from 'crypto';
import { join } from 'path';
import { createWriteStream, existsSync, mkdirSync, unlinkSync } from 'fs';
import { pipeline } from 'stream/promises';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository:
            Repository<User>,
    ) { }

    async findAll(query: GetUsersInput) {
        const pageNumber = query.page ?? 1;
        const pageSize = query.pageSize ?? 10;

        const qb = this.userRepository
            .createQueryBuilder('user')
            .select([
                'user.id',
                'user.username',
                'user.email',
                'user.full_name',
                'user.avatar',
                'user.role',
                'user.is_active',
                'user.is_email_verified',
                'user.created_at',
                'user.updated_at',
            ]);

        if (query.keyword?.trim()) {
            qb.andWhere(
                `(
                    user.username ILIKE :keyword
                    OR user.email ILIKE :keyword
                    OR user.full_name ILIKE :keyword
                )`,
                {
                    keyword:
                        `%${query.keyword.trim()}%`,
                },
            );
        }

        if (query.role !== undefined) {
            qb.andWhere(
                'user.role = :role',
                {
                    role: query.role,
                },
            );
        }

        if (query.is_active !== undefined) {
            qb.andWhere(
                'user.is_active = :isActive',
                {
                    isActive: query.is_active,
                },
            );
        }

        qb.orderBy('user.id', 'DESC');

        qb.skip(
            (pageNumber - 1) * pageSize,
        );

        qb.take(pageSize);

        const [items, totalItems] =
            await qb.getManyAndCount();

        return {
            pageNumber,
            pageSize,
            totalItems,
            totalPages: Math.ceil(
                totalItems / pageSize,
            ),
            items,
        };
    }

    async findOne(id: number) {
        const user =
            await this.userRepository.findOne({
                where: {
                    id,
                },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    full_name: true,
                    avatar: true,
                    role: true,
                    is_active: true,
                    is_email_verified: true,
                    created_at: true,
                    updated_at: true,
                },
            });

        if (!user) {
            throw new NotFoundException(
                'User not found',
            );
        }

        return user;
    }

    async getMyProfile(userId: number) {
        return this.findOne(userId);
    }

    async updateMyProfile(userId: number, input: UpdateProfileInput) {
        const user =
            await this.userRepository.findOneBy({ id: userId });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        if (input.email !== undefined) {
            const email = input.email.trim().toLowerCase();
            const existingEmail = await this.userRepository.findOne({
                where: {
                    email,
                    id: Not(userId),
                }
            });
            if (existingEmail) {
                throw new BadRequestException('Email already exists');
            }
            if (user.email.toLowerCase() !== email) {
                user.email = email;
                user.is_email_verified = false; // sau đó user cần gọi resendVerificationEmail để xác thực email mới
                user.email_verification_token_hash = null;
                user.email_verification_expires_at = null;
            }
        }
        if (input.full_name !== undefined) {
            user.full_name = input.full_name.trim();
        }
        await this.userRepository.save(user);
        return this.findOne(userId);
    }

    async updateRole(currentUserId: number, targetUserId: number, input: UpdateUserRoleInput) {
        const targetUser =
            await this.userRepository.findOneBy({
                id: targetUserId,
            });

        if (!targetUser) {
            throw new NotFoundException(
                'User not found',
            );
        }

        if (currentUserId === targetUserId) {
            throw new BadRequestException(
                'You cannot change your own role',
            );
        }

        targetUser.role = input.role;

        await this.userRepository.save(
            targetUser,
        );

        return this.findOne(targetUserId);
    }

    async updateStatus(currentUserId: number, targetUserId: number, input: UpdateUserStatusInput) {
        const targetUser =
            await this.userRepository.findOneBy({
                id: targetUserId,
            });

        if (!targetUser) {
            throw new NotFoundException(
                'User not found',
            );
        }

        if (currentUserId === targetUserId) {
            throw new BadRequestException(
                'You cannot deactivate your own account',
            );
        }

        targetUser.is_active =
            input.is_active;

        await this.userRepository.save(
            targetUser,
        );

        return this.findOne(targetUserId);
    }

    async uploadAvatar(userId: number, upload: Promise<FileUpload>) {
        const user = await this.userRepository.findOneBy({ id: userId });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        const { mimetype, createReadStream } = await upload;
        const allowedMimeTypes = [
            'image/jpg',
            'image/jpeg',
            'image/png',
            'image/webp',
        ];
        if (!allowedMimeTypes.includes(mimetype)) {
            throw new BadRequestException('Only JPG, JPEG, PNG and WEBP images are allowed');
        }
        const extensionByMimeType:
            Record<string, string> = {
            'image/jpg': '.jpg',
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'image/webp': '.webp',
        };
        const extension = extensionByMimeType[mimetype];
        const filename = `${randomUUID()}${extension}`;
        const uploadDirectory = join(process.cwd(), 'uploads', 'avatars');
        if (!existsSync(uploadDirectory)) {
            mkdirSync(uploadDirectory, { recursive: true });
        }
        const filePath = join(uploadDirectory, filename);
        try {
            await pipeline(createReadStream(), createWriteStream(filePath));
        } catch {
            this.deleteFileIfExists(filePath);
            throw new BadRequestException('Unable to save uploaded avatar');
        }
        return this.updateAvatar(
            userId,
            filename,
        );
    }
    private async updateAvatar(userId: number, filename: string) {
        const newFilePath = join(process.cwd(), 'uploads', 'avatars', filename);
        const user = await this.userRepository.findOneBy({ id: userId });
        if (!user) {
            this.deleteFileIfExists(newFilePath);
            throw new NotFoundException('User not found');
        }
        const oldAvatarUrl = user.avatar;
        user.avatar = `/uploads/avatars/${filename}`;
        try {
            await this.userRepository.save(user);
        } catch (error) {
            //Nếu update database thất bại,
            //xóa ảnh vừa upload để tránh file rác.
            this.deleteFileIfExists(newFilePath);
            throw error;
        }
        //Chỉ xóa ảnh cũ sau khi lưu database thành công.
        if (oldAvatarUrl && oldAvatarUrl.startsWith('/uploads/avatars/')) {
            const oldFilename = oldAvatarUrl.replace('/uploads/avatars/', '');
            const oldFilePath = join(process.cwd(), 'uploads', 'avatars', oldFilename,);
            this.deleteFileIfExists(oldFilePath);
        }
        return this.findOne(userId);
    }
    private deleteFileIfExists(filePath: string): void {
        if (existsSync(filePath)) {
            unlinkSync(filePath);
        }
    }

    async changeMyPassword(userId: number, currentPassword: string, newPassword: string, confirmPassword: string) {
        if (newPassword !== confirmPassword) {
            throw new BadRequestException('Password confirmation does not match',);
        }
        const user = await this.userRepository.findOneBy({ id: userId, });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isCurrentPasswordValid) {
            throw new BadRequestException('Current password is incorrect');
        }
        const isSamePassword = await bcrypt.compare(newPassword, user.password_hash);
        if (isSamePassword) {
            throw new BadRequestException('New password must be different from the current password',);
        }
        user.password_hash = await bcrypt.hash(newPassword, 10);

        // Nếu trước đó có yêu cầu quên mật khẩu,
        // token reset cũ cũng phải bị vô hiệu.
        user.password_reset_token_hash = null;
        user.password_reset_expires_at = null;
        await this.userRepository.save(user);
        return {
            message: 'Password changed successfully'
        };
    }
}
