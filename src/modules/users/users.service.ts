import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Not, Repository } from 'typeorm';
import { GetUsersInput } from './graphql/get-users.input';
import { UpdateProfileInput } from './graphql/update-profile.input';
import { UpdateUserRoleInput } from './graphql/update-user-role.input';
import { UpdateUserStatusInput } from './graphql/update-user-status.input';

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

    async updateMyProfile(
        userId: number,
        input: UpdateProfileInput,
    ) {
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

    async updateRole(
        currentUserId: number,
        targetUserId: number,
        input: UpdateUserRoleInput,
    ) {
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

    async updateStatus(
        currentUserId: number,
        targetUserId: number,
        input: UpdateUserStatusInput,
    ) {
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
}
