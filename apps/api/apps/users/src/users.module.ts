import { RefreshToken } from '@app/entities/refresh-token.entity';
import { typeOrmConfig } from '@app/entities/typeorm/typeorm-config';
import { User } from '@app/entities/user.entity';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health/health.controller';
import { RefreshTokensRepository } from './refresh-tokens/refresh-tokens.repository';
import { RefreshTokensService } from './refresh-tokens/refresh-tokens.service';
import { UsersController } from './users/users.controller';
import { UsersRepository } from './users/users.repository';
import { UsersService } from './users/users.service';

@Module({
  imports: [
    ConfigModule.forRoot({isGlobal: true, envFilePath: 'app/apps/api/apps/users/.env'}),
    TypeOrmModule.forRootAsync(typeOrmConfig),
    TypeOrmModule.forFeature([User, RefreshToken]),
  ],
  controllers: [
        UsersController,  
        HealthController
  ],
  providers: [
    RefreshTokensRepository,
    UsersRepository,
    RefreshTokensService,
    UsersService
  ],
})
export class UsersModule {}
