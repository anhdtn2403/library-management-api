import { Injectable, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import { AuthGuard } from "@nestjs/passport";

// Guard này dùng để chặn API nếu không có token.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    getRequest(context: ExecutionContext) {
        if (context.getType<'graphql' | 'http'>() === 'graphql') {
            const ctx = GqlExecutionContext.create(context);
            return ctx.getContext().req;
        }

        return context.switchToHttp().getRequest();
    }
    handleRequest<TUser = any>(err: any, user: TUser, info: any,): TUser {
        if (err) {
            throw err;
        }

        if (!user) {
            if (info?.name === 'TokenExpiredError') {
                throw new UnauthorizedException(
                    'Token đăng nhập đã hết hạn',
                );
            }

            if (info?.name === 'JsonWebTokenError') {
                throw new UnauthorizedException(
                    'Token đăng nhập không hợp lệ',
                );
            }

            throw new UnauthorizedException(
                'Bạn chưa đăng nhập',
            );
        }
        return user;
    }
}