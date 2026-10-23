/*
https://docs.nestjs.com/controllers#controllers
*/

import { UserAccountCreationDto, UserConnectionDto, UserResponseDto } from '@app/contracts/dto/user';
import { UserPatterns } from '@app/contracts/patterns/users-patterns';
import { Public } from '@app/modules/decorators/public.decorator';
import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices/client/index.js';
import { firstValueFrom } from "rxjs";

@Controller('users')
export class UsersController {
    constructor(@Inject('NATS_SERVICE') private readonly natsClient: ClientProxy) {}

    @Post()
    async createUser(@Body() userData: UserAccountCreationDto ): Promise<UserResponseDto> {
        return await firstValueFrom<UserResponseDto>(this.natsClient.send({ cmd: UserPatterns.CREATE_USER }, userData));
    }

    @Public()
    @Post('login')
    async login(@Body() userData: UserConnectionDto): Promise<UserResponseDto> {
        return await firstValueFrom<UserResponseDto>(this.natsClient.send({ cmd: UserPatterns.LOGIN_USER }, userData));
    }
}
