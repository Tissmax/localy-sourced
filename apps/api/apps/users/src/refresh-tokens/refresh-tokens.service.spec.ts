// users/refresh-tokens.service.spec.ts
import { RpcException } from '@nestjs/microservices';
import { createHash } from 'node:crypto';
import type { Mocked } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { UsersRepository } from '../users/users.repository';
import type { RefreshTokensRepository } from './refresh-tokens.repository';
import { RefreshTokensService } from './refresh-tokens.service';

const NOW = new Date('2026-10-23T12:00:00.000Z');
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

function makeStored(overrides: Record<string, unknown> = {}) {
  return {
    id: 't1',
    tokenHash: 'irrelevant',
    userId: 'u1',
    familyId: 'f1',
    expiresAt: new Date(NOW.getTime() + 60_000),
    revokedAt: null,
    ...overrides,
  };
}

function expectInvalidRefreshToken(error: unknown) {
  expect(error).toBeInstanceOf(RpcException);
  expect((error as RpcException).getError()).toEqual({
    status: 401,
    message: 'Refresh token invalide',
  });
}

describe('RefreshTokensService', () => {
  let service: RefreshTokensService;
  let tokensRepo: Mocked<RefreshTokensRepository>;
  let usersRepo: Mocked<UsersRepository>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    tokensRepo = {
      save: vi.fn(),
      findByHash: vi.fn(),
      revokeIfActive: vi.fn(),
      revokeFamily: vi.fn(),
      revokeAllForUser: vi.fn(),
    } as unknown as Mocked<RefreshTokensRepository>;

    usersRepo = { findById: vi.fn() } as unknown as Mocked<UsersRepository>;

    service = new RefreshTokensService(tokensRepo, usersRepo);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('issue', () => {
    it('renvoie un token aléatoire opaque (48 octets en base64url)', async () => {
      const token = await service.issue('u1');

      expect(token).toMatch(/^[A-Za-z0-9_-]{64}$/);
    });

    it('génère un token différent à chaque appel', async () => {
      const first = await service.issue('u1');
      const second = await service.issue('u1');

      expect(first).not.toBe(second);
    });

    it('stocke le hash SHA-256 du token', async () => {
      const token = await service.issue('u1');

      expect(tokensRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ tokenHash: sha256(token), userId: 'u1' }),
      );
    });

    it('ne stocke jamais la valeur brute du token', async () => {
      const token = await service.issue('u1');

      expect(JSON.stringify(tokensRepo.save.mock.calls)).not.toContain(token);
    });

    it('réutilise la famille fournie', async () => {
      await service.issue('u1', 'family-9');

      expect(tokensRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ familyId: 'family-9' }),
      );
    });

    it('fixe l\'expiration à 7 jours', async () => {
      await service.issue('u1');

      expect(tokensRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ expiresAt: new Date(NOW.getTime() + SEVEN_DAYS_MS) }),
      );
    });
  });

  describe('rotate', () => {
    const user = {
      id: 'u1',
      email: 'a@b.fr',
      roles: ['user'],
      passwordHash: 'secret-hash',
    };

    it('recherche le token par son hash, jamais par sa valeur brute', async () => {
      tokensRepo.findByHash.mockResolvedValue(null);

      await service.rotate('presented-token').catch(() => undefined);

      expect(tokensRepo.findByHash).toHaveBeenCalledWith(sha256('presented-token'));
    });

    it('refuse un token inconnu sans révoquer de famille', async () => {
      tokensRepo.findByHash.mockResolvedValue(null);

      const error = await service.rotate('inconnu').catch((e) => e);

      expectInvalidRefreshToken(error);
      expect(tokensRepo.revokeFamily).not.toHaveBeenCalled();
    });

    it('refuse un token expiré', async () => {
      tokensRepo.findByHash.mockResolvedValue(
        makeStored({ expiresAt: new Date(NOW.getTime() - 1) }) as never,
      );

      const error = await service.rotate('expire').catch((e) => e);

      expectInvalidRefreshToken(error);
      expect(tokensRepo.revokeIfActive).not.toHaveBeenCalled();
      expect(tokensRepo.save).not.toHaveBeenCalled();
    });

    it('révoque toute la famille quand un token déjà révoqué est réutilisé', async () => {
      tokensRepo.findByHash.mockResolvedValue(
        makeStored({ revokedAt: new Date(NOW.getTime() - 1000) }) as never,
      );

      const error = await service.rotate('deja-utilise').catch((e) => e);

      expectInvalidRefreshToken(error);
      expect(tokensRepo.revokeFamily).toHaveBeenCalledWith('f1');
      expect(tokensRepo.revokeIfActive).not.toHaveBeenCalled();
      expect(tokensRepo.save).not.toHaveBeenCalled();
    });

    it('révoque la famille si une autre requête a consommé le token en même temps', async () => {
      tokensRepo.findByHash.mockResolvedValue(makeStored() as never);
      tokensRepo.revokeIfActive.mockResolvedValue(false);

      const error = await service.rotate('course-perdue').catch((e) => e);

      expectInvalidRefreshToken(error);
      expect(tokensRepo.revokeFamily).toHaveBeenCalledWith('f1');
      expect(tokensRepo.save).not.toHaveBeenCalled();
    });

    it('refuse (sans émettre de nouveau token) si le compte n\'existe plus', async () => {
      tokensRepo.findByHash.mockResolvedValue(makeStored() as never);
      tokensRepo.revokeIfActive.mockResolvedValue(true);
      usersRepo.findById.mockResolvedValue(null);

      const error = await service.rotate('compte-supprime').catch((e) => e);

      expectInvalidRefreshToken(error);
      expect(tokensRepo.save).not.toHaveBeenCalled();
    });

    describe('quand le token est valide', () => {
      beforeEach(() => {
        tokensRepo.findByHash.mockResolvedValue(
          makeStored({ userId: 'dd4cc8a2-4d22-4c26-b5d0-d90afd2ebcc0' }) as never,
        );
        tokensRepo.revokeIfActive.mockResolvedValue(true);
        usersRepo.findById.mockResolvedValue({
          id: "dd4cc8a2-4d22-4c26-b5d0-d90afd2ebcc0",
          email: 'a@b.fr',
          roles: ['user'],
          passwordHash: 'secret-hash',
          isActive: true,
          createdAt: new Date(),
          lastName: 'Doe',
          firstName: 'John',
        });
      });

      it('révoque l\'ancien token', async () => {
        await service.rotate('valide');

        expect(tokensRepo.revokeIfActive).toHaveBeenCalledWith('t1');
      });

      it('émet un nouveau token dans la même famille, pour le même utilisateur', async () => {
        const result = await service.rotate('valide');

        expect(tokensRepo.save).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 'dd4cc8a2-4d22-4c26-b5d0-d90afd2ebcc0',
            familyId: 'f1',
            tokenHash: sha256(result.refreshToken),
          }),
        );
        expect(result.refreshToken).not.toBe('valide');
      });

      it('révoque l\'ancien token avant d\'émettre le nouveau', async () => {
        await service.rotate('valide');

        expect(tokensRepo.revokeIfActive.mock.invocationCallOrder[0]).toBeLessThan(
          tokensRepo.save.mock.invocationCallOrder[0]!,
        );
      });

      it('recharge l\'utilisateur pour refléter ses rôles actuels', async () => {
        await service.rotate('valide');

        expect(usersRepo.findById).toHaveBeenCalledWith('dd4cc8a2-4d22-4c26-b5d0-d90afd2ebcc0');
      });

      it('renvoie l\'utilisateur sans passwordHash', async () => {
        const result = await service.rotate('valide');

        expect(result.user).toEqual({ id: 'dd4cc8a2-4d22-4c26-b5d0-d90afd2ebcc0', email: 'a@b.fr', roles: ['user'], isActive: true, createdAt: expect.any(Date), lastName: 'Doe', firstName: 'John' });
        expect(JSON.stringify(result)).not.toContain('secret-hash');
      });

      it('ne révoque pas la famille', async () => {
        await service.rotate('valide');

        expect(tokensRepo.revokeFamily).not.toHaveBeenCalled();
      });
    });
  });

  describe('revoke', () => {
    it('révoque toute la famille d\'un token connu', async () => {
      tokensRepo.findByHash.mockResolvedValue(makeStored() as never);

      await service.revoke('connu');

      expect(tokensRepo.findByHash).toHaveBeenCalledWith(sha256('connu'));
      expect(tokensRepo.revokeFamily).toHaveBeenCalledWith('f1');
    });

    it('ne fait rien et ne plante pas pour un token inconnu', async () => {
      tokensRepo.findByHash.mockResolvedValue(null);

      await expect(service.revoke('inconnu')).resolves.toBeUndefined();
      expect(tokensRepo.revokeFamily).not.toHaveBeenCalled();
    });
  });
});