FROM node:20-alpine
WORKDIR /app

RUN npm install -g pnpm typescript

# 复制源码（node_modules 被 .dockerignore 排除）
COPY . .

# 安装并构建
RUN pnpm install
RUN pnpm run -r build

# 运行
EXPOSE 3000
CMD cd apps/web && npx next start