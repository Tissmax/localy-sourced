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
      swc.vite(),
      tsconfigPaths({ projects: [path.resolve(process.cwd(), 'tsconfig.json')] }),
    ],
    test: {
      root: 'src',
      include: ['**/*.spec.ts'],
      environment: 'node',
      testTimeout: 30_000,
      fileParallelism: false, // équivalent de maxWorkers: 1
      coverage: {
        include: ['**/*.{ts,js}'],
        reportsDirectory: path.resolve(process.cwd(), 'coverage'),
      },
    },
  }),
);