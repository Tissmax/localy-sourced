FROM node:22-bookworm-slim

WORKDIR /workspace

RUN corepack enable && corepack prepare pnpm@8.15.5 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json ./
COPY apps ./apps
COPY packages ./packages

RUN pnpm install --frozen-lockfile

EXPOSE 3000 3001

CMD ["pnpm", "dev"]