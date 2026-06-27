import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

// Guard này dùng để chặn API nếu không có token.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') { }