/*
https://docs.nestjs.com/controllers#controllers
*/

import { UserAccountCreationDto, UserConnectionDto, UserResponseDto } from '@app/contracts/dto/user';
import { UserPatterns } from '@app/contracts/patterns/users-patterns';
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices/decorators/index.js';
import { RefreshTokensService } from '../refresh-tokens/refresh-tokens.service';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly refreshTokensService: RefreshTokensService
    ) {}

    @MessagePattern({ cmd: UserPatterns.CREATE_USER })
    async createUser(userData: UserAccountCreationDto): Promise<UserResponseDto> {
        return await this.usersService.save(userData);
    }

    @MessagePattern({ cmd: UserPatterns.LOGIN_USER })
    async login(userData: UserConnectionDto): Promise<UserResponseDto> {
        return await this.usersService.login(userData);
    }
    @MessagePattern({ cmd: UserPatterns.ISSUE_REFRESH_TOKEN })
    issueRefreshToken(data: { userId: string }) {
    return this.refreshTokensService.issue(data.userId);
    }

    @MessagePattern({ cmd: UserPatterns.ROTATE_REFRESH_TOKEN })
    rotateRefreshToken(data: { token: string }) {
    return this.refreshTokensService.rotate(data.token);
    }

    @MessagePattern({ cmd: UserPatterns.REVOKE_REFRESH_TOKEN })
    revokeRefreshToken(data: { token: string }) {
    return this.refreshTokensService.revoke(data.token);
}
}
