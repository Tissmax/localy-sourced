/*
https://docs.nestjs.com/controllers#controllers
*/

import { RefreshDto } from '@app/contracts/dto/token';
import { UserAccountCreationDto, UserConnectionDto, UserResponseDto } from '@app/contracts/dto/user';
import { UserPatterns } from '@app/contracts/patterns/users-patterns';
import { Public } from '@app/modules/decorators/public.decorator';
import { Body, Controller, HttpCode, Inject, Post, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices/client/index.js';
import { minutes, Throttle } from '@nestjs/throttler';
import { firstValueFrom } from "rxjs";
import { AuthService } from '../auth/auth.service';
import { LoginThrottlerGuard } from '../auth/login-throttler.guard';

@Controller('users')
export class UsersController {
    constructor(
        @Inject('NATS_SERVICE') private readonly natsClient: ClientProxy,
        private readonly authService: AuthService
    ) {}

    @Public()
    @Post()
    async createUser(@Body() userData: UserAccountCreationDto ): Promise<UserResponseDto> {
        return await firstValueFrom<UserResponseDto>(this.natsClient.send({ cmd: UserPatterns.CREATE_USER }, userData));
    }

    @Public()
    @UseGuards(LoginThrottlerGuard)
    @Throttle({ default: {limit: 5, ttl: minutes(5)}})
    @Post('login')
    async login(@Body() userData: UserConnectionDto): Promise<{ accessToken: string }> {
        return await this.authService.login(userData);
    }

    @Public() // l'access token est justement expiré quand on appelle cette route
    @Post('refresh')
    @HttpCode(200)
    refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
    }

    @Public()
    @Post('logout')
    @HttpCode(204)
    async logout(@Body() dto: RefreshDto) {
    await this.authService.logout(dto.refreshToken);
    }
}
