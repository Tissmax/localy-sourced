// apps/api/apps/products/src/database/typeorm.config.ts
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';

const isTest = process.env.NODE_ENV === 'test';

export const typeOrmConfig: TypeOrmModuleAsyncOptions = ({
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    type: 'postgres',
    host: config.getOrThrow('DB_HOST'),
    port: Number(config.getOrThrow('DB_PORT')),
    database: config.getOrThrow('DB_NAME'),
    username: config.getOrThrow('DB_USER'),
    password: config.getOrThrow('DB_PASSWORD'),
    schema: config.getOrThrow('DB_SCHEMA'),
    autoLoadEntities: true,
    synchronize: isTest,        // schéma créé depuis les entités, test uniquement
    migrationsRun: !isTest,     // en dev/prod : migrations
    logging: !isTest,           // logs SQL coupés en test
    // Voir ci-dessous : nécessaire avec un rôle non superuser
    uuidExtension: 'pgcrypto',
    installExtensions: false,
  }),
});