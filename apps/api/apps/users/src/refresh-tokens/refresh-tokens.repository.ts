import { RefreshToken } from "@app/entities/refresh-token.entity";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull } from "typeorm/find-options/operator/IsNull.js";
import { Repository } from "typeorm/repository/Repository.js";

@Injectable()
export class RefreshTokensRepository {
  constructor(@InjectRepository(RefreshToken) private readonly repo: Repository<RefreshToken>) {}

  save(token: Partial<RefreshToken>) {
    return this.repo.save(token);
  }

  findByHash(tokenHash: string) {
    return this.repo.findOne({ where: { tokenHash } });
  }

  /** Révoque un token seulement s'il est encore actif. true = c'est nous qui l'avons révoqué. */
  async revokeIfActive(id: string): Promise<boolean> {
    const result = await this.repo.update({ id, revokedAt: IsNull() }, { revokedAt: new Date() });
    return (result.affected ?? 0) === 1;
  }

  revokeFamily(familyId: string) {
    return this.repo.update({ familyId, revokedAt: IsNull() }, { revokedAt: new Date() });
  }

  revokeAllForUser(userId: string) {
    return this.repo.update({ userId, revokedAt: IsNull() }, { revokedAt: new Date() });
  }
}