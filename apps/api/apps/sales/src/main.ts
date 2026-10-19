import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { SalesModule } from './sales.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(SalesModule, {
    transport: Transport.NATS,
    options: {
      servers: [process.env.NATS_URL || 'nats://nats:4222'],
    },
  });
  await app.listen();
}
bootstrap();
