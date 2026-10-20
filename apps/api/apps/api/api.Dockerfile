ARG NODE_VERSION=24.13.1
FROM base AS builder
RUN pnpm --filter api exec nest build api

ARG NODE_VERSION=24.13.1
FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app
# Don't run production as root
RUN addgroup -S -g 1001 nestjs
RUN adduser -S -D -u 1001 -G nestjs api
USER api
COPY --from=builder --chown=nestjs:nestjs /app .

CMD ["sh", "-c", "exec node apps/api/dist/apps/api/main.js"]