import path from 'node:path';
import swc from 'unplugin-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

const apps = ['gateway', 'products', 'sales', 'users'];

export default defineConfig({
  plugins: [
    swc.vite(),
    tsconfigPaths({ projects: [path.resolve(__dirname, 'tsconfig.json')] }),
  ],
  test: {
    passWithNoTests: true,
    globals: true,
    environment: 'node',
    testTimeout: 30_000,
    hookTimeout: 30_000,
    fileParallelism: false, // mêmes bases Postgres / NATS / Redis partagées
    projects: apps.map((app) => ({
      extends: true,
      test: {
        name: app,
        root: `./apps/${app}`,
        include: ['test/**/*.e2e-spec.ts'],
      },
    })),
  },
});