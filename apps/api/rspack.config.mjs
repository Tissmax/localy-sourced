// @ts-check
import { defineConfig } from '@rspack/cli';
import { rspack } from '@rspack/core';
import fs from 'node:fs';
import path from 'node:path';
import { RunScriptWebpackPlugin } from 'run-script-webpack-plugin';

const rootDir = import.meta.dirname; // = apps/api
const isDev = process.env.NODE_ENV !== 'production';
const apps = ['gateway', 'products', 'sales', 'users'];

/** @param {string} s */
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Un seul package.json, partagé par toutes les apps
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const externalDeps = Object.keys(pkg.dependencies ?? {}).filter((d) => !d.startsWith('@repo/'));

const externals = [
  new RegExp(`^(${externalDeps.map(escapeRe).join('|')})(/|$)`),
  // Modules optionnels chargés dynamiquement par Nest
  /^(kafkajs|mqtt|amqplib|amqp-connection-manager|@grpc\/.*|ioredis|@nestjs\/websockets.*|class-validator|class-transformer)$/,
];

/** @param {string} name */
function createNestConfig(name) {
  const appDir = path.join(rootDir, 'apps', name);

  return defineConfig({
    name,
    context: appDir,
    target: 'node',
    entry: {
      main: isDev ? ['@rspack/core/hot/poll?100', './src/main.ts'] : './src/main.ts',
    },
    output: {
      path: path.join(rootDir, isDev ? 'dist-dev' : 'dist', 'apps', name),
      clean: true,
      filename: '[name].cjs',
    },
    resolve: {
      extensions: ['...', '.ts'],
      tsConfig: path.join(appDir, 'tsconfig.app.json'),
      alias: {
      '@repo/schema$': path.resolve(rootDir, '../../packages/schema/src/index.ts'),
      },
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: {
            loader: 'builtin:swc-loader',
            options: {
              detectSyntax: 'auto',
              jsc: {
                target: 'es2022',
                parser: { syntax: 'typescript', decorators: true },
                transform: { legacyDecorator: true, decoratorMetadata: true },
              },
            },
          },
        },
      ],
    },
    optimization: {
      minimizer: [
        new rspack.SwcJsMinimizerRspackPlugin({
          minimizerOptions: {
            compress: { keep_classnames: true, keep_fnames: true },
            mangle: { keep_classnames: true, keep_fnames: true },
          },
        }),
      ],
    },
    externalsType: 'commonjs',
    plugins: isDev
      ? [
          new RunScriptWebpackPlugin({ name: 'main.cjs', autoRestart: false }),
          new rspack.HotModuleReplacementPlugin(),
        ]
      : [],
    externals,
  });
}

/** @param {{ app?: string }} [env] valeur passée via --env app=gateway */
export default (env = {}) => {
  const selected = env.app ? [env.app] : apps;
  return selected.map(createNestConfig);
};