import { nestConfig } from '@repo/jest-config/nest';
import path from 'node:path';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
  nestConfig,
  defineConfig({
    test: {
      root: '.',
      include: ['apps/**/src/**/*.spec.ts', 'libs/**/*.spec.ts'],
      exclude: ['**/node_modules/**', '**/*.e2e.spec.ts'],
    },
    resolve: {
      alias: [
        {
          find: /^@repo\/schema$/,
          replacement: path.resolve(__dirname, '../../packages/schema/src/index.ts'),
        },
      ]
    }
  }),
);