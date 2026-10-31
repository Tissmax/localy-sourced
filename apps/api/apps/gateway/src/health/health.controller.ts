/*
https://docs.nestjs.com/controllers#controllers
*/

import { Public } from '@app/modules/decorators/public.decorator';
import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices/client/client-proxy';
import { HealthResponse } from '@repo/schema';
import { firstValueFrom } from 'rxjs';

@Controller('health')
export class HealthController {
    constructor(@Inject('NATS_SERVICE') private natsClient: ClientProxy) {}

    @Public()
    @Get('products')
    async getProductsHealth(): Promise<HealthResponse> {
        return firstValueFrom(
            this.natsClient.send({ cmd: 'products.health' }, {}),
        );
    }

    @Public()
    @Get('sales')
    async getSalesHealth(): Promise<HealthResponse> {
        return firstValueFrom(
            this.natsClient.send({ cmd: 'sales.health' }, {}),
        );

    }

    @Public()
    @Get('users')
    async getUsersHealth(): Promise<HealthResponse> {
        return firstValueFrom(
            this.natsClient.send({ cmd: 'users.health' }, {}),
        );

    }

}

