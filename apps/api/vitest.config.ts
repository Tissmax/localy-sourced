import { nestConfig } from '@repo/jest-config/nest';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
  nestConfig,
  defineConfig({
    test: {
      root: '.',
      include: ['apps/**/src/**/*.spec.ts', 'libs/**/*.spec.ts'],
      exclude: ['**/node_modules/**', '**/*.e2e.spec.ts'],
    },
  }),
);