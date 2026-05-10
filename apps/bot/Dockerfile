FROM node:20-alpine
WORKDIR /app

RUN npm install -g pnpm typescript

COPY . .

RUN pnpm install
RUN pnpm --filter @costools/shared-types build
RUN pnpm --filter @costools/bot build

EXPOSE 9000
CMD ["node", "apps/bot/dist/index.js"]
