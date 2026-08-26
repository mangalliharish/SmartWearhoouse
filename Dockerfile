# Stage 1: Build Frontend & Backend
FROM node:22-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate

# Copy monorepo dependency definitions
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json tsconfig.json ./
COPY lib/db/package.json ./lib/db/
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY artifacts/smartwarehouse/package.json ./artifacts/smartwarehouse/
COPY scripts/package.json ./scripts/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY lib/ ./lib/
COPY artifacts/ ./artifacts/
COPY scripts/ ./scripts/

# Build project references, backend and frontend
RUN pnpm run build

# Seed initial database
RUN pnpm run seed

# Stage 2: Production Runtime
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

RUN corepack enable && corepack prepare pnpm@10.33.2 --activate

# Copy built application and modules
COPY --from=builder /app /app

EXPOSE 8080

CMD ["pnpm", "run", "start"]
