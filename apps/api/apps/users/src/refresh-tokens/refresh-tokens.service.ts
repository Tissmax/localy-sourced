// users/refresh-tokens.service.ts
import { RefreshResponseDto } from '@app/contracts/dto/token';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices/exceptions/index.js';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { UsersRepository } from '../users/users.repository';
import { RefreshTokensRepository } from './refresh-tokens.repository';

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class RefreshTokensService {
  constructor(
    private readonly tokensRepo: RefreshTokensRepository,
    private readonly usersRepo: UsersRepository,
  ) {}

  private hash(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private unauthorized(): never {
    throw new RpcException({ status: 401, message: 'Refresh token invalide' });
  }

  async issue(userId: string, familyId: string = randomUUID()) {
    const token = randomBytes(48).toString('base64url'); // la valeur brute n'est jamais stockée
    await this.tokensRepo.save({
      tokenHash: this.hash(token),
      userId,
      familyId,
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    });
    return token;
  }

  async rotate(token: string): Promise<RefreshResponseDto> {
    const stored = await this.tokensRepo.findByHash(this.hash(token));
    if (!stored) this.unauthorized();

    // Token déjà utilisé ou révoqué : probable vol, on coupe toute la famille
    if (stored.revokedAt) {
      await this.tokensRepo.revokeFamily(stored.familyId);
      this.unauthorized();
    }
    if (stored.expiresAt < new Date()) this.unauthorized();

    // Révocation atomique : si on perd la course contre une autre requête, c'est une réutilisation
    const revoked = await this.tokensRepo.revokeIfActive(stored.id);
    if (!revoked) {
      await this.tokensRepo.revokeFamily(stored.familyId);
      this.unauthorized();
    }

    const user = await this.usersRepo.findById(stored.userId);
    if (!user) this.unauthorized(); // compte supprimé entre-temps
    
    const { passwordHash, ...safeUser } = user;
    const refreshToken = await this.issue(user.id, stored.familyId);
    return RefreshResponseDto.create({ refreshToken, user: safeUser });
  }

  async revoke(token: string) {
    const stored = await this.tokensRepo.findByHash(this.hash(token));
    if (stored) await this.tokensRepo.revokeFamily(stored.familyId);
  }
}