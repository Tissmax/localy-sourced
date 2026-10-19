import react from '@vitejs/plugin-react';
import path from 'node:path';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig, mergeConfig } from 'vitest/config';
import { baseConfig } from './base';

export const nextConfig = mergeConfig(
  baseConfig,
  defineConfig({
    plugins: [
      react({}),
      tsconfigPaths({ projects: [path.resolve(process.cwd(), 'tsconfig.json')] }),
    ],
    test: {
      environment: 'jsdom',
      include: ['**/*.{spec,test}.{ts,tsx}'],
      exclude: ['**/node_modules/**', '**/.next/**', '**/e2e/**'],
      css: true,
    },
  }),
);