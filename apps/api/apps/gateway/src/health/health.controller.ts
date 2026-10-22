/*
https://docs.nestjs.com/controllers#controllers
*/

import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices/client/client-proxy';
import { HealthResponse } from '@repo/schema';
import { firstValueFrom } from 'rxjs';

@Controller('health')
export class HealthController {
    constructor(@Inject('NATS_SERVICE') private natsClient: ClientProxy) {}

    @Get('products')
    async getProductsHealth(): Promise<HealthResponse> {
        return firstValueFrom(
            this.natsClient.send({ cmd: 'products.health' }, {}),
        );
    }

    @Get('sales')
    async getSalesHealth(): Promise<HealthResponse> {
        return firstValueFrom(
            this.natsClient.send({ cmd: 'sales.health' }, {}),
        );

    }

    @Get('users')
    async getUsersHealth(): Promise<HealthResponse> {
        return firstValueFrom(
            this.natsClient.send({ cmd: 'users.health' }, {}),
        );

    }

}

