/*
https://docs.nestjs.com/controllers#controllers
*/

import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices/decorators/message-pattern.decorator';

@Controller()
export class HealthController {
    @MessagePattern({ cmd: 'products.health' })
    getHealth() {
        return { status: 'ok' };
    }
}
