// auth/jwt.strategy.spec.ts (gateway)
import type { ConfigService } from '@nestjs/config';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let config: { getOrThrow: Mock };

  beforeEach(() => {
    config = { getOrThrow: vi.fn().mockReturnValue('test-secret') };
  });

  const createStrategy = () => new JwtStrategy(config as unknown as ConfigService);

  describe('constructeur', () => {
    it('lit le secret JWT_SECRET dans la configuration', () => {
      createStrategy();

      expect(config.getOrThrow).toHaveBeenCalledWith('JWT_SECRET');
    });

    it('échoue au démarrage si JWT_SECRET est absent (plutôt que d\'accepter n\'importe quel token)', () => {
      config.getOrThrow.mockImplementation(() => {
        throw new Error('Configuration key "JWT_SECRET" does not exist');
      });

      expect(createStrategy).toThrow('JWT_SECRET');
    });
  });

  describe('validate', () => {
    it('transforme le payload du token en utilisateur de la requête', async () => {
      const strategy = createStrategy();

      const result = await strategy.validate({
        sub: 'u1',
        email: 'a@b.fr',
        roles: ['user', 'admin'],
      });

      expect(result).toEqual({ userId: 'u1', email: 'a@b.fr', roles: ['user', 'admin'] });
    });

    it('ne recopie pas les autres claims du token (iat, exp...)', async () => {
      const strategy = createStrategy();

      const result = await strategy.validate({
        sub: 'u1',
        email: 'a@b.fr',
        roles: ['user'],
        iat: 1700000000,
        exp: 1700000900,
      } as never);

      expect(Object.keys(result).sort()).toEqual(['email', 'roles', 'userId']);
    });
  });
});