import { NatsClientModule } from '@app/modules/nats-client/nats-client.module';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

// auth/auth.module.ts (gateway)
@Module({
  imports: [
    NatsClientModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  providers: [JwtStrategy, AuthService],
  exports: [JwtModule, AuthService],
})
export class AuthModule {}