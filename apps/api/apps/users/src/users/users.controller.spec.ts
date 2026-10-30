// users/users.controller.spec.ts
import type { UserAccountCreationDto, UserConnectionDto } from '@app/contracts/dto/user';
import { UserPatterns } from '@app/contracts/patterns/users-patterns';
import { RpcException } from '@nestjs/microservices';
import { PATTERN_METADATA } from '@nestjs/microservices/constants';
import 'reflect-metadata';
import type { Mocked } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RefreshTokensService } from '../refresh-tokens/refresh-tokens.service';
import { UsersController } from './users.controller';
import type { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: Mocked<UsersService>;
  let refreshTokensService: Mocked<RefreshTokensService>;

  beforeEach(() => {
    usersService = {
      save: vi.fn(),
      login: vi.fn(),
    } as unknown as Mocked<UsersService>;

    refreshTokensService = {
      issue: vi.fn(),
      rotate: vi.fn(),
      revoke: vi.fn(),
    } as unknown as Mocked<RefreshTokensService>;

    controller = new UsersController(usersService, refreshTokensService);
  });

  describe('routage des messages NATS', () => {
    // Un test unitaire n'exécute jamais le décorateur : on vérifie ici que chaque méthode
    // est bien branchée sur le bon pattern (une faute de frappe passerait sinon inaperçue).
    it.each([
      ['createUser', UserPatterns.CREATE_USER],
      ['login', UserPatterns.LOGIN_USER],
      ['issueRefreshToken', UserPatterns.ISSUE_REFRESH_TOKEN],
      ['rotateRefreshToken', UserPatterns.ROTATE_REFRESH_TOKEN],
      ['revokeRefreshToken', UserPatterns.REVOKE_REFRESH_TOKEN],
    ] as const)('%s répond au pattern { cmd: %s }', (method, cmd) => {
      const handler = UsersController.prototype[method];

      expect(Reflect.getMetadata(PATTERN_METADATA, handler)).toEqual([{ cmd }]);
    });
  });

  describe('createUser', () => {
    it('délègue la création au service et renvoie son résultat', async () => {
      const dto = { email: 'a@b.fr', password: 'secret123' } as UserAccountCreationDto;
      const created = { id: 'u1', email: 'a@b.fr', roles: ['user'] };
      usersService.save.mockResolvedValue(created as never);

      const result = await controller.createUser(dto);

      expect(usersService.save).toHaveBeenCalledWith(dto);
      expect(result).toBe(created);
    });
  });

  describe('login', () => {
    it('délègue la connexion au service et renvoie son résultat', async () => {
      const dto = { email: 'a@b.fr', password: 'secret123' } as UserConnectionDto;
      const user = { id: 'u1', email: 'a@b.fr', roles: ['user'] };
      usersService.login.mockResolvedValue(user as never);

      const result = await controller.login(dto);

      expect(usersService.login).toHaveBeenCalledWith(dto);
      expect(result).toBe(user);
    });

    it('laisse remonter l\'erreur 401 du service', async () => {
      const error = new RpcException({ status: 401, message: 'Identifiants invalides' });
      usersService.login.mockRejectedValue(error);

      await expect(
        controller.login({ email: 'a@b.fr', password: 'x' } as UserConnectionDto),
      ).rejects.toBe(error);
    });
  });

  describe('refresh tokens', () => {
    it('issueRefreshToken émet un token pour l\'utilisateur demandé', async () => {
      refreshTokensService.issue.mockResolvedValue('refresh-1');

      const result = await controller.issueRefreshToken({ userId: 'u1' });

      expect(refreshTokensService.issue).toHaveBeenCalledWith('u1');
      expect(result).toBe('refresh-1');
    });

    it('rotateRefreshToken transmet le token présenté au service', async () => {
      const rotated = { user: { id: 'u1', email: 'a@b.fr', roles: ['user'] }, refreshToken: 'refresh-2' };
      refreshTokensService.rotate.mockResolvedValue(rotated as never);

      const result = await controller.rotateRefreshToken({ token: 'refresh-1' });

      expect(refreshTokensService.rotate).toHaveBeenCalledWith('refresh-1');
      expect(result).toBe(rotated);
    });

    it('rotateRefreshToken laisse remonter l\'erreur 401 du service', async () => {
      const error = new RpcException({ status: 401, message: 'Refresh token invalide' });
      refreshTokensService.rotate.mockRejectedValue(error);

      await expect(controller.rotateRefreshToken({ token: 'x' })).rejects.toBe(error);
    });

    it('revokeRefreshToken transmet le token au service', async () => {
      await controller.revokeRefreshToken({ token: 'refresh-1' });

      expect(refreshTokensService.revoke).toHaveBeenCalledWith('refresh-1');
    });
  });
});