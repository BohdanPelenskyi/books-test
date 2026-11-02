# Build context is the repository root: docker build -f apps/api/Dockerfile .
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
# Prisma needs OpenSSL at runtime
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable
WORKDIR /app

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
# The prisma schema must exist before install, which generates the client
COPY apps/api/prisma apps/api/prisma
RUN pnpm install --frozen-lockfile --filter @book-exchange/api...
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter @book-exchange/shared build \
  && pnpm --filter @book-exchange/api exec prisma generate \
  && pnpm --filter @book-exchange/api build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app /app
WORKDIR /app/apps/api
EXPOSE 4000
# Applies pending migrations, then starts the API
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node dist/main"]
