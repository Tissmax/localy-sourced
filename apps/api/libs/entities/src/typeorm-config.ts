// apps/api/apps/products/src/database/typeorm.config.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

const isTest = process.env.NODE_ENV === 'test';

export const typeOrmConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  autoLoadEntities: true,
  synchronize: isTest,        // schéma créé depuis les entités, test uniquement
  migrationsRun: !isTest,     // en dev/prod : migrations
  logging: !isTest,           // logs SQL coupés en test
});