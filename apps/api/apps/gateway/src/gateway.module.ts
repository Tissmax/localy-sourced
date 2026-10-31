/*
https://docs.nestjs.com/modules
*/

import { NatsClientModule } from '@app/modules/nats-client/nats-client.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { minutes, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
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
        ThrottlerModule.forRoot({
            throttlers: [{ name: 'default', ttl: minutes(15), limit: 100 }],
        }),
    ],
    controllers: [
        HealthController, 
        UsersController
    ],
    providers: [
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: ThrottlerGuard },
        { provide: APP_PIPE, useClass: ZodValidationPipe },
        { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
    ],
})
export class GatewayModule {}
