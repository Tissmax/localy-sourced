import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices/client/client-proxy';
import { firstValueFrom } from 'rxjs';

@Controller('health')
export class HealthController {
  constructor(@Inject('NATS_SERVICE') private natsClient: ClientProxy) {}
  
  @Get('users')
  async checkUsersHealth() {
    return firstValueFrom(this.natsClient.send({ cmd: 'users.health' }, {}));
  }

  @Get('products')
  async checkProductsHealth() {
    return firstValueFrom(this.natsClient.send({ cmd: 'products.health' }, {}));
  }

  @Get('sales')
  async checkSalesHealth() {
    return firstValueFrom(this.natsClient.send({ cmd: 'sales.health' }, {}));
  }
}
