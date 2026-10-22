/*
https://docs.nestjs.com/modules
*/

import { NatsClientModule } from '@app/modules/nats-client/nats-client.module';
import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';

@Module({
    imports: [NatsClientModule],
    controllers: [HealthController],
    providers: [],
})
export class GatewayModule {}
