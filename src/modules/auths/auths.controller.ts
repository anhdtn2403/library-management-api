import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { AuthsService } from './auths.service';
import { RefreshTokenDto } from './dtos/refresh.dto';

@Controller('auths')
export class AuthsController {
    constructor(private readonly authsService: AuthsService) { }

    @Post('register')
    register(
        @Body() dto: RegisterDto
    ) {
        return this.authsService.register(dto);
    }

    @Post('login')
    @HttpCode(200)
    login(
        @Body() dto: LoginDto
    ) {
        return this.authsService.login(dto);
    }

    @Post('refresh')
    @HttpCode(200)
    refresh(
        @Body() dto: RefreshTokenDto,
    ) {
        return this.authsService.refresh(dto.refresh_token);
    }
}
