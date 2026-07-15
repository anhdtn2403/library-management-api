// Ý nghĩa: khi request gửi token lên, 
// NestJS sẽ giải mã token và gắn thông tin user vào request.user

import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { InjectRepository } from "@nestjs/typeorm";
import { ExtractJwt, Strategy } from "passport-jwt";
import { User } from "src/entities/user.entity";
import { Repository } from "typeorm";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly configService: ConfigService,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {
        const jwtSecret = configService.getOrThrow<string>('JWT_SECRET');
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: jwtSecret,
        });
    }

    async validate(payload: any) {
        const user =
            await this.userRepository.findOneBy({
                id: payload.sub,
            });

        if (!user || !user.is_active) {
            throw new UnauthorizedException(
                'Account is inactive or does not exist',
            );
        }
        return {
            userId: payload.sub,
            email: payload.email,
            role: payload.role,
        };
    }
}