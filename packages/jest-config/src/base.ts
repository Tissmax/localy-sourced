import path from 'node:path';
import { defineConfig } from 'vitest/config';

export const baseConfig = defineConfig({
  test: {
    globals: true, // garde describe/it/expect sans import, comme Jest
    environment: 'jsdom',
    coverage: {
      enabled: true,
      provider: 'v8',
      reportsDirectory: path.resolve(process.cwd(), 'coverage'),
    },
  },
});