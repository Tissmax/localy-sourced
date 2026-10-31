// auth/auth.service.spec.ts (gateway)
import { UserPatterns } from '@app/contracts/patterns/users-patterns';
import type { JwtService } from '@nestjs/jwt';
import type { ClientProxy } from '@nestjs/microservices';
import type { Observable } from 'rxjs';
import { NEVER, of, throwError, TimeoutError } from 'rxjs';
import type { Mock } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service';

const user = { id: 'u1', email: 'a@b.fr', roles: ['user'] };
const loginDto = { email: 'a@b.fr', password: 'secret123' };

describe('AuthService (gateway)', () => {
  let service: AuthService;
  let usersClient: { send: Mock };
  let jwtService: { signAsync: Mock };

  /** Simule les réponses du service users, selon le pattern demandé. */
  function mockUsers(responses: Record<string, Observable<unknown>>) {
    usersClient.send.mockImplementation(({ cmd }: { cmd: string }) => {
      return responses[cmd] ?? throwError(() => new Error(`Pattern inattendu : ${cmd}`));
    });
  }

  beforeEach(() => {
    usersClient = { send: vi.fn() };
    jwtService = { signAsync: vi.fn().mockResolvedValue('access-1') };

    service = new AuthService(
      usersClient as unknown as ClientProxy,
      jwtService as unknown as JwtService,
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('login', () => {
    it('renvoie un access token et un refresh token', async () => {
      mockUsers({
        [UserPatterns.LOGIN_USER]: of(user),
        [UserPatterns.ISSUE_REFRESH_TOKEN]: of('refresh-1'),
      });

      const result = await service.login(loginDto as never);

      expect(result).toEqual({ accessToken: 'access-1', refreshToken: 'refresh-1' });
    });

    it('envoie les identifiants au service users, puis demande un refresh token pour cet utilisateur', async () => {
      mockUsers({
        [UserPatterns.LOGIN_USER]: of(user),
        [UserPatterns.ISSUE_REFRESH_TOKEN]: of('refresh-1'),
      });

      await service.login(loginDto as never);

      expect(usersClient.send).toHaveBeenNthCalledWith(
        1,
        { cmd: UserPatterns.LOGIN_USER },
        loginDto,
      );
      expect(usersClient.send).toHaveBeenNthCalledWith(
        2,
        { cmd: UserPatterns.ISSUE_REFRESH_TOKEN },
        { userId: 'u1' },
      );
    });

    it('signe le JWT avec sub, email et roles, les champs lus par JwtStrategy', async () => {
      mockUsers({
        [UserPatterns.LOGIN_USER]: of(user),
        [UserPatterns.ISSUE_REFRESH_TOKEN]: of('refresh-1'),
      });

      await service.login(loginDto as never);

      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 'u1',
        email: 'a@b.fr',
        roles: ['user'],
      });
    });

    it('ne met que ces trois champs dans le JWT, même si le service en renvoie davantage', async () => {
      mockUsers({
        [UserPatterns.LOGIN_USER]: of({ ...user, passwordHash: 'leak', phone: '0600000000' }),
        [UserPatterns.ISSUE_REFRESH_TOKEN]: of('refresh-1'),
      });

      await service.login(loginDto as never);

      const [payload] = jwtService.signAsync.mock.calls[0]!;
      expect(Object.keys(payload).sort()).toEqual(['email', 'roles', 'sub']);
    });

    it('ne met pas le refresh token dans le JWT', async () => {
      mockUsers({
        [UserPatterns.LOGIN_USER]: of(user),
        [UserPatterns.ISSUE_REFRESH_TOKEN]: of('refresh-1'),
      });

      await service.login(loginDto as never);

      expect(JSON.stringify(jwtService.signAsync.mock.calls)).not.toContain('refresh-1');
    });

    it('propage l\'erreur 401 du service users sans signer de token ni émettre de refresh token', async () => {
      const unauthorized = { status: 401, message: 'Identifiants invalides' };
      mockUsers({ [UserPatterns.LOGIN_USER]: throwError(() => unauthorized) });

      await expect(service.login(loginDto as never)).rejects.toBe(unauthorized);

      expect(jwtService.signAsync).not.toHaveBeenCalled();
      expect(usersClient.send).toHaveBeenCalledTimes(1);
    });

    it('ne signe pas de token si l\'émission du refresh token échoue', async () => {
      const failure = new Error('db down');
      mockUsers({
        [UserPatterns.LOGIN_USER]: of(user),
        [UserPatterns.ISSUE_REFRESH_TOKEN]: throwError(() => failure),
      });

      await expect(service.login(loginDto as never)).rejects.toBe(failure);

      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('échoue avec un TimeoutError si le service users ne répond pas en 5 secondes', async () => {
      vi.useFakeTimers();
      mockUsers({ [UserPatterns.LOGIN_USER]: NEVER });

      const assertion = expect(service.login(loginDto as never)).rejects.toBeInstanceOf(
        TimeoutError,
      );
      await vi.advanceTimersByTimeAsync(5000);

      await assertion;
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('envoie le refresh token présenté au service users', async () => {
      mockUsers({
        [UserPatterns.ROTATE_REFRESH_TOKEN]: of({ user, refreshToken: 'refresh-2' }),
      });

      await service.refresh('refresh-1');

      expect(usersClient.send).toHaveBeenCalledWith(
        { cmd: UserPatterns.ROTATE_REFRESH_TOKEN },
        { token: 'refresh-1' },
      );
    });

    it('renvoie un nouvel access token et le refresh token tourné', async () => {
      mockUsers({
        [UserPatterns.ROTATE_REFRESH_TOKEN]: of({ user, refreshToken: 'refresh-2' }),
      });

      const result = await service.refresh('refresh-1');

      expect(result).toEqual({ accessToken: 'access-1', refreshToken: 'refresh-2' });
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 'u1',
        email: 'a@b.fr',
        roles: ['user'],
      });
    });

    it('propage l\'erreur 401 sans signer de token', async () => {
      const unauthorized = { status: 401, message: 'Refresh token invalide' };
      mockUsers({ [UserPatterns.ROTATE_REFRESH_TOKEN]: throwError(() => unauthorized) });

      await expect(service.refresh('refresh-1')).rejects.toBe(unauthorized);

      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('demande la révocation du refresh token au service users', async () => {
      mockUsers({ [UserPatterns.REVOKE_REFRESH_TOKEN]: of(undefined) });

      await service.logout('refresh-1');

      expect(usersClient.send).toHaveBeenCalledWith(
        { cmd: UserPatterns.REVOKE_REFRESH_TOKEN },
        { token: 'refresh-1' },
      );
    });
  });
});