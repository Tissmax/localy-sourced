// users/users.service.spec.ts
import type {
  UserAccountCreationDto,
  UserAccountUpdateDto,
  UserConnectionDto,
} from '@app/contracts/dto/user';
import { RpcException } from '@nestjs/microservices';
import * as argon2 from 'argon2';
import type { Mock, Mocked } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

// On ne calcule pas de vrais hashs argon2 : trop lent et inutile pour tester la logique
vi.mock('argon2', () => ({
  hash: vi.fn(),
  verify: vi.fn(),
}));

const hash = argon2.hash as unknown as Mock;
const verify = argon2.verify as unknown as Mock;

const DUMMY_HASH = 'hash-factice';

const storedUser = {
  id: 'u1',
  email: 'a@b.fr',
  roles: ['user'],
  passwordHash: 'stored-hash',
};

const creationDto = { email: 'a@b.fr', password: 'secret123' } as UserAccountCreationDto;
const loginDto = { email: 'a@b.fr', password: 'secret123' } as UserConnectionDto;

function expectInvalidCredentials(error: unknown) {
  expect(error).toBeInstanceOf(RpcException);
  expect((error as RpcException).getError()).toEqual({
    status: 401,
    message: 'Identifiants invalides',
  });
}

describe('UsersService', () => {
  let service: UsersService;
  let repo: Mocked<UsersRepository>;

  beforeEach(() => {
    vi.resetAllMocks();
    hash.mockResolvedValue(DUMMY_HASH);
    verify.mockResolvedValue(true);

    repo = {
      findByEmail: vi.fn(),
      findByEmailWithPassword: vi.fn(),
      findById: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as Mocked<UsersRepository>;

    service = new UsersService(repo);
  });

  describe('save', () => {
    it('hache le mot de passe avant de le stocker', async () => {
      hash.mockResolvedValue('argon2-hash');
      repo.save.mockResolvedValue({ ...storedUser, passwordHash: 'argon2-hash' } as never);

      await service.save(creationDto);

      expect(hash).toHaveBeenCalledWith('secret123');
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'a@b.fr', passwordHash: 'argon2-hash' }),
      );
    });

    it('ne transmet jamais le mot de passe en clair au repository', async () => {
      repo.save.mockResolvedValue(storedUser as never);

      await service.save(creationDto);

      const [saved] = repo.save.mock.calls[0]!;
      expect(saved).not.toHaveProperty('password');
      expect(JSON.stringify(saved)).not.toContain('secret123');
    });

    it('ne renvoie pas passwordHash', async () => {
      repo.save.mockResolvedValue(storedUser as never);

      const result = await service.save(creationDto);

      expect(result).toEqual({ id: 'u1', email: 'a@b.fr', roles: ['user'] });
      expect(result).not.toHaveProperty('passwordHash');
    });
  });

  describe('login', () => {
    it('renvoie l\'utilisateur quand les identifiants sont corrects', async () => {
      repo.findByEmailWithPassword.mockResolvedValue(storedUser as never);

      const result = await service.login(loginDto);

      expect(repo.findByEmailWithPassword).toHaveBeenCalledWith('a@b.fr');
      expect(verify).toHaveBeenCalledWith('stored-hash', 'secret123');
      expect(result).toEqual({ id: 'u1', email: 'a@b.fr', roles: ['user'] });
    });

    it('ne renvoie jamais passwordHash', async () => {
      repo.findByEmailWithPassword.mockResolvedValue(storedUser as never);

      const result = await service.login(loginDto);

      expect(result).not.toHaveProperty('passwordHash');
      expect(JSON.stringify(result)).not.toContain('stored-hash');
    });

    it('refuse un email inconnu avec une RpcException 401', async () => {
      repo.findByEmailWithPassword.mockResolvedValue(null);

      const error = await service.login(loginDto).catch((e) => e);

      expectInvalidCredentials(error);
    });

    it('refuse un email inconnu même si verify répondait true', async () => {
      repo.findByEmailWithPassword.mockResolvedValue(null);
      verify.mockResolvedValue(true);

      const error = await service.login(loginDto).catch((e) => e);

      expectInvalidCredentials(error);
    });

    it('compare quand même un hash factice si l\'email est inconnu (temps de réponse constant)', async () => {
      repo.findByEmailWithPassword.mockResolvedValue(null);

      await service.login(loginDto).catch(() => undefined);

      expect(verify).toHaveBeenCalledTimes(1);
      expect(verify).toHaveBeenCalledWith(DUMMY_HASH, 'secret123');
    });

    it('refuse un mauvais mot de passe avec une RpcException 401', async () => {
      repo.findByEmailWithPassword.mockResolvedValue(storedUser as never);
      verify.mockResolvedValue(false);

      const error = await service.login(loginDto).catch((e) => e);

      expectInvalidCredentials(error);
    });

    it('renvoie exactement la même erreur pour un email inconnu et un mauvais mot de passe', async () => {
      repo.findByEmailWithPassword.mockResolvedValueOnce(null);
      const unknownEmail = await service.login(loginDto).catch((e) => e);

      repo.findByEmailWithPassword.mockResolvedValueOnce(storedUser as never);
      verify.mockResolvedValueOnce(false);
      const wrongPassword = await service.login(loginDto).catch((e) => e);

      expect((unknownEmail as RpcException).getError()).toEqual(
        (wrongPassword as RpcException).getError(),
      );
    });

    it('répond 401 (et non 500) si le hash stocké est illisible', async () => {
      repo.findByEmailWithPassword.mockResolvedValue(storedUser as never);
      verify.mockRejectedValue(new Error('pchstr must contain a $ as first char'));

      const error = await service.login(loginDto).catch((e) => e);

      expectInvalidCredentials(error);
    });
  });

  describe('délégation au repository', () => {
    it('findByEmail', async () => {
      repo.findByEmail.mockResolvedValue(storedUser as never);

      const result = await service.findByEmail('a@b.fr');

      expect(repo.findByEmail).toHaveBeenCalledWith('a@b.fr');
      expect(result).toEqual({ id: 'u1', email: 'a@b.fr', roles: ['user'] });
    });

    it('update', async () => {
      const dto = { email: 'new@b.fr' } as UserAccountUpdateDto;
      repo.update.mockResolvedValue({ affected: 1 } as never);
      repo.findById.mockResolvedValue(storedUser as never);

      await service.update('u1', dto);

      expect(repo.update).toHaveBeenCalledWith('u1', dto);
    });

    it('delete', async () => {
      repo.delete.mockResolvedValue({ affected: 1 } as never);

      await service.delete('u1');

      expect(repo.delete).toHaveBeenCalledWith('u1');
    });
  });
});