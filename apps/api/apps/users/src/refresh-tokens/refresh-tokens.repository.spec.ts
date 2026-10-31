// users/refresh-tokens.repository.spec.ts
import type { Repository } from 'typeorm';
import { IsNull } from 'typeorm';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RefreshTokensRepository } from './refresh-tokens.repository';

/**
 * Ces tests ne vérifient pas TypeORM, mais les conditions que notre code lui passe.
 * La plus importante : "revokedAt IS NULL", qui rend la révocation atomique
 * (deux requêtes simultanées ne peuvent pas consommer le même token).
 */
describe('RefreshTokensRepository', () => {
  let typeorm: { save: Mock; findOne: Mock; update: Mock };
  let repo: RefreshTokensRepository;

  beforeEach(() => {
    typeorm = { save: vi.fn(), findOne: vi.fn(), update: vi.fn() };
    repo = new RefreshTokensRepository(typeorm as unknown as Repository<never>);
  });

  it('findByHash cherche sur la colonne tokenHash', async () => {
    await repo.findByHash('abc');

    expect(typeorm.findOne).toHaveBeenCalledWith({ where: { tokenHash: 'abc' } });
  });

  describe('revokeIfActive', () => {
    it('ne cible que les tokens non révoqués', async () => {
      typeorm.update.mockResolvedValue({ affected: 1 });

      await repo.revokeIfActive('t1');

      expect(typeorm.update).toHaveBeenCalledWith(
        { id: 't1', revokedAt: IsNull() },
        { revokedAt: expect.any(Date) },
      );
    });

    it('renvoie true quand une ligne a été révoquée', async () => {
      typeorm.update.mockResolvedValue({ affected: 1 });

      await expect(repo.revokeIfActive('t1')).resolves.toBe(true);
    });

    it('renvoie false quand le token était déjà révoqué (0 ligne modifiée)', async () => {
      typeorm.update.mockResolvedValue({ affected: 0 });

      await expect(repo.revokeIfActive('t1')).resolves.toBe(false);
    });

    it('renvoie false quand le driver ne renseigne pas affected', async () => {
      typeorm.update.mockResolvedValue({});

      await expect(repo.revokeIfActive('t1')).resolves.toBe(false);
    });
  });

  it('revokeFamily ne révoque que les tokens actifs de la famille', async () => {
    await repo.revokeFamily('f1');

    expect(typeorm.update).toHaveBeenCalledWith(
      { familyId: 'f1', revokedAt: IsNull() },
      { revokedAt: expect.any(Date) },
    );
  });

  it('revokeAllForUser ne révoque que les tokens actifs de l\'utilisateur', async () => {
    await repo.revokeAllForUser('u1');

    expect(typeorm.update).toHaveBeenCalledWith(
      { userId: 'u1', revokedAt: IsNull() },
      { revokedAt: expect.any(Date) },
    );
  });
});