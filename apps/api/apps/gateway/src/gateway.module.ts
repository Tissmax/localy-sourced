/*
https://docs.nestjs.com/modules
*/

import { NatsClientModule } from '@app/modules/nats-client/nats-client.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { HealthController } from './health/health.controller';
import { UsersController } from './users/users.controller';

@Module({
    imports: [
        NatsClientModule,
        AuthModule,
        ConfigModule.forRoot({ isGlobal: true }),
    ],
    controllers: [
        HealthController, 
        UsersController
    ],
    providers: [
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_PIPE, useClass: ZodValidationPipe },
        { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
    ],
})
export class GatewayModule {}
