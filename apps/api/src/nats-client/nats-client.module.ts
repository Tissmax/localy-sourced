import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      // registering NATS
      {
        name: 'NATS_SERVICE',
        transport: Transport.NATS,
        options: {
          servers: ['nats://nats:4222'], // specifying the NATS server URL
        },
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class NatsClientModule {}
