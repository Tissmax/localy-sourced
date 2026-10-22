/*
https://docs.nestjs.com/controllers#controllers
*/

import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices/decorators/message-pattern.decorator';
import { type HealthResponse } from '@repo/schema';

@Controller()
export class HealthController {
    @MessagePattern({ cmd: 'users.health' })
    getHealth(): HealthResponse {
        return { status: 'ok' };
    }
}
