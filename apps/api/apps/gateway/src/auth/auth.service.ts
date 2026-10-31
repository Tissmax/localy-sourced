// auth/auth.service.ts (gateway)
import { LoginResponseDto } from '@app/contracts/dto/token';
import { UserConnectionDto, UserResponseDto } from '@app/contracts/dto/user';
import { UserPatterns } from '@app/contracts/patterns/users-patterns';
import { call } from '@app/modules/nats-client/call';
import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class AuthService {
    constructor(
        @Inject('NATS_SERVICE') private readonly natsClient: ClientProxy,
        private readonly jwtService: JwtService,
    ) {}

    private async buildTokens(user: UserResponseDto, refreshToken: string) {
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      roles: user.roles,
    });
    return { accessToken, refreshToken } as LoginResponseDto;
  }

  async login(dto: UserConnectionDto) {
    const user = await call<UserResponseDto>(this.natsClient, UserPatterns.LOGIN_USER, dto);
    const refreshToken = await call<string>(this.natsClient, UserPatterns.ISSUE_REFRESH_TOKEN, { userId: user.id });
    return this.buildTokens(user, refreshToken);
  }

  async refresh(token: string) {
    const { user, refreshToken } = await call<{ user: UserResponseDto; refreshToken: string }>(
      this.natsClient,
      UserPatterns.ROTATE_REFRESH_TOKEN,
      { token },
    );
    return this.buildTokens(user, refreshToken);
  }

  logout(token: string) {
    return call<void>(this.natsClient, UserPatterns.REVOKE_REFRESH_TOKEN, { token });
  }
}