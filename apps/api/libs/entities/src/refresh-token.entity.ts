// @app/entities/refresh-token.entity.ts
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column()
  tokenHash!: string;

  @Index()
  @Column('uuid')
  userId!: string;

  // Tous les tokens issus d'un même login partagent le même familyId
  @Index()
  @Column('uuid')
  familyId!: string;

  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;
}