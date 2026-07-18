# Build context is the repo root (needs packages/shared as a workspace dependency):
#   docker build -f apps/api/Dockerfile .
# docker-compose.prod.yml sets this context/dockerfile automatically.

FROM node:24-alpine AS base
RUN corepack enable
WORKDIR /repo

# ---- build ----
FROM base AS build
# bcrypt is a native addon; alpine/musl has no prebuilt binary, so it compiles from source.
RUN apk add --no-cache python3 make g++

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --frozen-lockfile --filter "@crm/api..."

COPY packages/shared packages/shared
COPY apps/api apps/api

RUN pnpm --filter @crm/shared build
RUN pnpm --filter @crm/api exec prisma generate
RUN pnpm --filter @crm/api build

# ---- runtime ----
FROM base AS runtime
ENV NODE_ENV=production
RUN apk add --no-cache dumb-init
WORKDIR /repo

COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/package.json ./package.json
COPY --from=build /repo/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=build /repo/packages/shared ./packages/shared
COPY --from=build /repo/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /repo/apps/api/package.json ./apps/api/package.json
COPY --from=build /repo/apps/api/dist ./apps/api/dist
COPY --from=build /repo/apps/api/prisma ./apps/api/prisma
COPY apps/api/docker-entrypoint.sh ./apps/api/docker-entrypoint.sh
RUN chmod +x ./apps/api/docker-entrypoint.sh && chown -R node:node /repo

WORKDIR /repo/apps/api
USER node

EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["dumb-init", "--", "./docker-entrypoint.sh"]
CMD ["node", "dist/src/main.js"]
