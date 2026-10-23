import { Module } from '@nestjs/common';
import { UsersController } from './../../gateway/src/users/users.controller';
import { HealthController } from './health/health.controller';

@Module({
  imports: [],
  controllers: [
        UsersController, HealthController],
})
export class UsersModule {}
