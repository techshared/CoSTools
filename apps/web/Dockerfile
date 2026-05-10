FROM node:20-alpine
WORKDIR /app

RUN npm install -g pnpm typescript

# Cache deps: copy package files first
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json ./
COPY apps/web/package.json apps/web/tsconfig.json apps/web/next.config.js apps/web/tailwind.config.js apps/web/postcss.config.js ./apps/web/
COPY packages/shared-types/package.json packages/shared-types/tsconfig.json ./packages/shared-types/
COPY packages/utils/package.json packages/utils/tsconfig.json ./packages/utils/
COPY packages/api-client/package.json packages/api-client/tsconfig.json ./packages/api-client/

RUN pnpm install

# Copy source
COPY packages/shared-types/src ./packages/shared-types/src
COPY packages/utils/src ./packages/utils/src
COPY packages/api-client/src ./packages/api-client/src
COPY apps/web/src ./apps/web/src


# Build
RUN pnpm run -r build

EXPOSE 3000
CMD cd apps/web && npx next start
