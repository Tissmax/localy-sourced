import path from 'node:path';
import swc from 'unplugin-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig, mergeConfig } from 'vitest/config';
import { baseConfig } from './base';

export const nestConfig = mergeConfig(
  baseConfig,
  defineConfig({
    // SWC génère les métadonnées de décorateurs dont Nest a besoin (remplace ts-jest)
    plugins: [
      swc.vite({ module: { type: 'es6' } }),
      tsconfigPaths({ projects: [path.resolve(process.cwd(), 'tsconfig.json')] }),
    ],
    test: {
      globals: true,
      root: 'src',
      include: ['**/*.spec.ts'],
      environment: 'node',
      testTimeout: 30_000,
      fileParallelism: false, // équivalent de maxWorkers: 1
      coverage: {
        include: ['**/*.{ts,js}'],
        exclude: [
          '**/*.d.ts',
          '**/*.spec.ts',
          '**/*.e2e.spec.ts',
          '**/node_modules/**',
          '**/main.ts',
          '**/index.ts',
          '**/*config.ts',
          '**/dist/**',
          '**/gateway/**/*.controller.ts',
          '**/*module.ts',
          '**/contracts/**/*.{ts,js}',
          '**/entities/**/*.{ts,js}',
          '**/*.decorator.{ts,js}',
          '**/interfaces/**/*.{ts,js}',
          '**/types/**/*.{ts,js}',
          '**/*.strategy.{ts,js}',
          '**/*.pipe.{ts,js}',
          '**/*.repository.{ts,js}',
          '**/dist-dev/**'
        ],
        reportsDirectory: path.resolve(process.cwd(), 'coverage'),
      },
    },
  }),
);